package food

import (
	"archive/zip"
	"context"
	"encoding/xml"
	"errors"
	"fmt"
	"io"
	"math"
	"regexp"
	"sort"
	"strconv"
	"strings"

	"lume/backend/internal/db"
)

// AFCD is the Australian Food Composition Database (Food Standards Australia
// New Zealand), loaded into the afcd_foods table by tools/afcd from the
// official "Nutrient profiles" Excel file. Licence and attribution:
// legal/AFCD_LICENCE.md.

// AFCDFood is one food from the per 100 g sheet. Nutrients the file leaves
// blank stay nil, so a missing figure never becomes a reported zero.
type AFCDFood struct {
	Key      string // Public Food Key, e.g. F002258
	Name     string
	EnergyKJ float64 // energy with dietary fibre, equated
	Protein  *float64
	Fat      *float64
	Carbs    *float64 // available carbohydrate, with sugar alcohols
	Fibre    *float64
}

// afcdColumns maps the header text (lower case, whitespace collapsed, unit
// suffix removed) of the AFCD per 100 g sheet to the field it fills.
var afcdColumns = []string{
	"public food key",
	"food name",
	"energy with dietary fibre, equated",
	"protein",
	"fat, total",
	"available carbohydrate, with sugar alcohols",
	"total dietary fibre",
}

var (
	spaceRE = regexp.MustCompile(`\s+`)
	unitRE  = regexp.MustCompile(`\s*\([^()]*\)$`)
	cellRE  = regexp.MustCompile(`^[A-Z]+`)
)

func normHeader(s string) string {
	s = strings.ToLower(strings.TrimSpace(spaceRE.ReplaceAllString(s, " ")))
	return unitRE.ReplaceAllString(s, "")
}

type xlsxCell struct {
	Ref    string `xml:"r,attr"`
	Type   string `xml:"t,attr"`
	Value  string `xml:"v"`
	Inline struct {
		T string `xml:"t"`
	} `xml:"is"`
}

type xlsxSheet struct {
	Rows []struct {
		Cells []xlsxCell `xml:"c"`
	} `xml:"sheetData>row"`
}

type xlsxStrings struct {
	Items []struct {
		T    string `xml:"t"`
		Runs []struct {
			T string `xml:"t"`
		} `xml:"r"`
	} `xml:"si"`
}

func readXML(f *zip.File, dst any) error {
	rc, err := f.Open()
	if err != nil {
		return err
	}
	defer rc.Close()
	return xml.NewDecoder(rc).Decode(dst)
}

// ParseAFCD reads the AFCD "Nutrient profiles" workbook and returns the foods
// on its per 100 g sheet (the sheet whose title says "per 100 g" and whose
// header row holds "Public Food Key"). It reads the .xlsx with the standard
// library only: an xlsx is a zip of XML parts.
func ParseAFCD(r io.ReaderAt, size int64) ([]AFCDFood, error) {
	zr, err := zip.NewReader(r, size)
	if err != nil {
		return nil, fmt.Errorf("afcd: not an xlsx file: %w", err)
	}
	var shared []string
	var sheets []*zip.File
	for _, f := range zr.File {
		switch {
		case f.Name == "xl/sharedStrings.xml":
			var sst xlsxStrings
			if err := readXML(f, &sst); err != nil {
				return nil, fmt.Errorf("afcd: shared strings: %w", err)
			}
			for _, it := range sst.Items {
				s := it.T
				for _, run := range it.Runs {
					s += run.T
				}
				shared = append(shared, s)
			}
		case strings.HasPrefix(f.Name, "xl/worksheets/sheet") && strings.HasSuffix(f.Name, ".xml"):
			sheets = append(sheets, f)
		}
	}
	sort.Slice(sheets, func(i, j int) bool { return sheets[i].Name < sheets[j].Name })

	text := func(c xlsxCell) string {
		switch c.Type {
		case "s":
			if i, err := strconv.Atoi(c.Value); err == nil && i >= 0 && i < len(shared) {
				return shared[i]
			}
			return ""
		case "inlineStr":
			return c.Inline.T
		}
		return c.Value
	}

	for _, f := range sheets {
		var sh xlsxSheet
		if err := readXML(f, &sh); err != nil {
			return nil, fmt.Errorf("afcd: %s: %w", f.Name, err)
		}
		per100g, header := false, -1
		for i := 0; i < len(sh.Rows) && i < 10 && header < 0; i++ {
			for _, c := range sh.Rows[i].Cells {
				t := strings.ToLower(text(c))
				if strings.Contains(t, "per 100 g") {
					per100g = true
				}
				if normHeader(t) == "public food key" {
					header = i
				}
			}
		}
		if !per100g || header < 0 {
			continue
		}
		return parseAFCDRows(sh, header, text)
	}
	return nil, errors.New("afcd: no per 100 g sheet with a Public Food Key header")
}

func parseAFCDRows(sh xlsxSheet, header int, text func(xlsxCell) string) ([]AFCDFood, error) {
	col := map[string]string{} // header name -> column letters
	for _, c := range sh.Rows[header].Cells {
		col[normHeader(text(c))] = cellRE.FindString(c.Ref)
	}
	for _, name := range afcdColumns {
		if col[name] == "" {
			return nil, fmt.Errorf("afcd: column %q not found; the file format may have changed", name)
		}
	}
	var out []AFCDFood
	for _, row := range sh.Rows[header+1:] {
		v := map[string]string{}
		for _, c := range row.Cells {
			v[cellRE.FindString(c.Ref)] = strings.TrimSpace(text(c))
		}
		get := func(name string) string { return v[col[name]] }
		num := func(name string) *float64 {
			n, err := strconv.ParseFloat(get(name), 64)
			if err != nil || n < 0 {
				return nil
			}
			n = math.Round(n*100) / 100 // the file stores float noise like 8.3000000000000007
			return &n
		}
		key, name, energy := get("public food key"), get("food name"), num("energy with dietary fibre, equated")
		if key == "" || name == "" || energy == nil {
			continue
		}
		out = append(out, AFCDFood{
			Key:      key,
			Name:     name,
			EnergyKJ: *energy,
			Protein:  num("protein"),
			Fat:      num("fat, total"),
			Carbs:    num("available carbohydrate, with sugar alcohols"),
			Fibre:    num("total dietary fibre"),
		})
	}
	if len(out) == 0 {
		return nil, errors.New("afcd: the per 100 g sheet has no foods")
	}
	return out, nil
}

// ImportAFCD replaces the afcd_foods table with foods in one transaction, so a
// failed import leaves the previous release in place.
func ImportAFCD(ctx context.Context, q db.Querier, foods []AFCDFood, release string) error {
	n := len(foods)
	keys, names := make([]string, n), make([]string, n)
	energy := make([]float64, n)
	protein, fat, carbs, fibre := make([]*float64, n), make([]*float64, n), make([]*float64, n), make([]*float64, n)
	for i, f := range foods {
		keys[i], names[i], energy[i] = f.Key, f.Name, f.EnergyKJ
		protein[i], fat[i], carbs[i], fibre[i] = f.Protein, f.Fat, f.Carbs, f.Fibre
	}
	tx, err := q.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	if _, err := tx.Exec(ctx, `DELETE FROM afcd_foods`); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `INSERT INTO afcd_foods
		(food_key, food_name, energy_kj, protein_g, fat_g, carbs_g, fibre_g, release)
		SELECT k, nm, e, p, f, c, fb, $8
		FROM unnest($1::text[], $2::text[], $3::numeric[], $4::numeric[], $5::numeric[], $6::numeric[], $7::numeric[])
		AS t(k, nm, e, p, f, c, fb)`,
		keys, names, energy, protein, fat, carbs, fibre, release); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

// likeEscaper escapes LIKE wildcards so user text matches literally.
var likeEscaper = strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`)

// afcdSearchLimit is how many Australian foods one search returns at most.
const afcdSearchLimit = 15

// SearchAFCD finds Australian foods whose name contains every word of q.
// Names that start with the whole query come first, then shorter (plainer)
// names. Values are per 100 g; energy is converted from kJ to kcal, the
// canonical unit the app converts back from.
func (s *PGStore) SearchAFCD(ctx context.Context, q string) ([]SearchResult, error) {
	words := strings.Fields(strings.ToLower(q))
	if len(words) == 0 {
		return nil, nil
	}
	pats := make([]string, len(words))
	for i, w := range words {
		pats[i] = "%" + likeEscaper.Replace(w) + "%"
	}
	rows, err := s.q.Query(ctx, `SELECT food_name, energy_kj::float8,
			coalesce(protein_g, 0)::float8, coalesce(carbs_g, 0)::float8, coalesce(fat_g, 0)::float8, fibre_g::float8
		FROM afcd_foods
		WHERE lower(food_name) LIKE ALL($1::text[])
		ORDER BY (lower(food_name) LIKE $2) DESC, length(food_name), food_name
		LIMIT $3`, pats, likeEscaper.Replace(strings.Join(words, " "))+"%", afcdSearchLimit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []SearchResult
	for rows.Next() {
		var r SearchResult
		var kj float64
		if err := rows.Scan(&r.FoodName, &kj, &r.Protein, &r.Carbs, &r.Fat, &r.Fibre); err != nil {
			return nil, err
		}
		r.Calories = KJToKcal(kj)
		r.ServingSize, r.ServingUnit, r.Source = 100, "g", SourceAFCD
		out = append(out, r)
	}
	return out, rows.Err()
}

// SourceAFCD tags search results from the Australian table.
const SourceAFCD = "afcd"

// KJPerKcal is the thermochemical calorie, the factor Australian labels use.
const KJPerKcal = 4.184

// KJToKcal converts kilojoules to kilocalories, rounded to 0.1 kcal.
func KJToKcal(kj float64) float64 {
	return math.Round(kj/KJPerKcal*10) / 10
}
