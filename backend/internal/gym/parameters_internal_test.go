// In-package test: ValidateAndFill's helpers (toFloat, intFromParams,
// validOption) and the ParamSchemas seed are unexported/internal, so the full
// branch matrix is only reachable from here. Pure functions — hermetic.
package gym

import (
	"encoding/json"
	"reflect"
	"strings"
	"testing"
)

// testSchema covers every field type plus the switch's default branch.
var testSchema = ParameterSchema{
	Fields: []ParameterField{
		{Key: "dur", Type: "number", Required: true, Min: fptr(1), Max: fptr(300)},
		{Key: "slide", Type: "slider", Default: 5.0, Min: fptr(0), Max: fptr(10)},
		{Key: "pick", Type: "select", Default: "b", Options: []ParamOption{{"a", "A"}, {"b", "B"}}},
		{Key: "free", Type: "select"}, // no options list: any string ok
		{Key: "flag", Type: "toggle"},
		{Key: "opt", Type: "number", Min: fptr(0), Max: fptr(100)}, // optional, no default
		{Key: "mystery", Type: "text"},                             // unknown type → passthrough
	},
	CalorieFormula: "met_fallback",
}

func TestValidateAndFill(t *testing.T) {
	cases := []struct {
		name         string
		raw          map[string]any
		wantErr      string // substring; "" = no error
		wantFilled   map[string]any
		wantDefaults bool
	}{
		{
			name:    "unknown key",
			raw:     map[string]any{"dur": 30.0, "bogus": 1.0},
			wantErr: "unknown parameter: bogus",
		},
		{
			name:    "missing required",
			raw:     map[string]any{"flag": true},
			wantErr: "missing required parameter: dur",
		},
		{
			name:    "nil value counts as absent for required",
			raw:     map[string]any{"dur": nil},
			wantErr: "missing required parameter: dur",
		},
		{
			name:    "string where number",
			raw:     map[string]any{"dur": "thirty"},
			wantErr: "dur must be a number",
		},
		{
			name:    "number where select",
			raw:     map[string]any{"dur": 30.0, "pick": 2.0},
			wantErr: "pick must be one of the allowed options",
		},
		{
			name:    "number where toggle",
			raw:     map[string]any{"dur": 30.0, "flag": 1.0},
			wantErr: "flag must be true or false",
		},
		{
			name:    "select invalid option",
			raw:     map[string]any{"dur": 30.0, "pick": "z"},
			wantErr: "pick must be one of the allowed options",
		},
		{
			name:         "select with no options accepts any string",
			raw:          map[string]any{"dur": 30.0, "free": "anything"},
			wantFilled:   map[string]any{"dur": 30.0, "free": "anything", "slide": 5.0, "pick": "b"},
			wantDefaults: true,
		},
		{
			name:    "number below min",
			raw:     map[string]any{"dur": 0.5},
			wantErr: "dur must be at least 1",
		},
		{
			name:    "number above max",
			raw:     map[string]any{"dur": 301.0},
			wantErr: "dur must be at most 300",
		},
		{
			name:    "slider below min",
			raw:     map[string]any{"dur": 30.0, "slide": -1.0},
			wantErr: "slide must be at least 0",
		},
		{
			name:    "slider above max",
			raw:     map[string]any{"dur": 30.0, "slide": 11.0},
			wantErr: "slide must be at most 10",
		},
		{
			name:         "exact boundaries pass",
			raw:          map[string]any{"dur": 1.0, "slide": 10.0, "opt": 0.0},
			wantFilled:   map[string]any{"dur": 1.0, "slide": 10.0, "opt": 0.0, "pick": "b"},
			wantDefaults: true, // pick's default
		},
		{
			name:         "optional absent with default → filled, defaultsUsed",
			raw:          map[string]any{"dur": 30.0, "flag": false},
			wantFilled:   map[string]any{"dur": 30.0, "flag": false, "slide": 5.0, "pick": "b"},
			wantDefaults: true,
		},
		{
			name:         "optional absent without default → omitted",
			raw:          map[string]any{"dur": 30.0, "slide": 2.0, "pick": "a"},
			wantFilled:   map[string]any{"dur": 30.0, "slide": 2.0, "pick": "a"}, // no opt, free, flag, mystery
			wantDefaults: false,
		},
		{
			name:    "nil raw map",
			raw:     nil,
			wantErr: "missing required parameter: dur",
		},
		{
			name:         "unknown field type passes value through",
			raw:          map[string]any{"dur": 30.0, "slide": 1.0, "pick": "a", "mystery": []any{"x"}},
			wantFilled:   map[string]any{"dur": 30.0, "slide": 1.0, "pick": "a", "mystery": []any{"x"}},
			wantDefaults: false,
		},
		{
			name:         "int and json.Number accepted as numbers",
			raw:          map[string]any{"dur": 30, "opt": json.Number("42.5")},
			wantFilled:   map[string]any{"dur": 30.0, "opt": 42.5, "slide": 5.0, "pick": "b"},
			wantDefaults: true,
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			filled, defaultsUsed, err := ValidateAndFill(testSchema, tc.raw)
			if tc.wantErr != "" {
				if err == nil {
					t.Fatalf("want error containing %q, got nil (filled=%v)", tc.wantErr, filled)
				}
				if !strings.Contains(err.Error(), tc.wantErr) {
					t.Fatalf("error = %q, want substring %q", err.Error(), tc.wantErr)
				}
				if filled != nil {
					t.Fatalf("filled should be nil on error, got %v", filled)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if !reflect.DeepEqual(filled, tc.wantFilled) {
				t.Fatalf("filled = %v, want %v", filled, tc.wantFilled)
			}
			if defaultsUsed != tc.wantDefaults {
				t.Fatalf("defaultsUsed = %v, want %v", defaultsUsed, tc.wantDefaults)
			}
		})
	}
}

func TestValidateAndFillNilRawNoRequired(t *testing.T) {
	schema := ParameterSchema{Fields: []ParameterField{
		{Key: "slide", Type: "slider", Default: 3.0},
		{Key: "opt", Type: "number"},
	}}
	filled, defaultsUsed, err := ValidateAndFill(schema, nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !defaultsUsed {
		t.Fatal("defaultsUsed = false, want true")
	}
	if want := map[string]any{"slide": 3.0}; !reflect.DeepEqual(filled, want) {
		t.Fatalf("filled = %v, want %v", filled, want)
	}
}

// --- schema integrity over the real seed -----------------------------------

var knownFormulas = map[string]bool{
	"acsm_treadmill": true,
	"acsm_cycling":   true,
	"rowing_power":   true,
	"acsm_stepping":  true,
	"met_fallback":   true,
}

var knownFieldTypes = map[string]bool{"number": true, "slider": true, "select": true, "toggle": true}

func TestParamSchemasIntegrity(t *testing.T) {
	if len(ParamSchemas) == 0 {
		t.Fatal("ParamSchemas is empty")
	}
	for name, schema := range ParamSchemas {
		if !knownFormulas[schema.CalorieFormula] {
			t.Errorf("%s: unknown calorie formula %q", name, schema.CalorieFormula)
		}
		hasDuration := false
		for _, f := range schema.Fields {
			if !knownFieldTypes[f.Type] {
				t.Errorf("%s/%s: unknown field type %q", name, f.Key, f.Type)
			}
			if f.Key == "duration_minutes" {
				hasDuration = true
				if !f.Required {
					t.Errorf("%s: duration_minutes must be required", name)
				}
			}
			if f.Required {
				if f.Min == nil || f.Max == nil {
					t.Errorf("%s/%s: required field missing min/max", name, f.Key)
				} else if *f.Min >= *f.Max {
					t.Errorf("%s/%s: min %g >= max %g", name, f.Key, *f.Min, *f.Max)
				}
			}
			if f.Type == "select" && len(f.Options) < 2 {
				t.Errorf("%s/%s: select needs >=2 options, has %d", name, f.Key, len(f.Options))
			}
		}
		if !hasDuration {
			t.Errorf("%s: schema has no duration_minutes field", name)
		}
	}
}

// --- toFloat / intFromParams ------------------------------------------------

func TestToFloat(t *testing.T) {
	cases := []struct {
		name string
		in   any
		want float64
		ok   bool
	}{
		{"float64", float64(2.5), 2.5, true},
		{"float32", float32(1.5), 1.5, true},
		{"int", int(7), 7, true},
		{"int64", int64(-3), -3, true},
		{"json.Number valid", json.Number("12.25"), 12.25, true},
		{"json.Number invalid", json.Number("nope"), 0, false},
		{"string", "5", 0, false},
		{"bool", true, 0, false},
		{"nil", nil, 0, false},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got, ok := toFloat(tc.in)
			if ok != tc.ok || got != tc.want {
				t.Fatalf("toFloat(%v) = (%v, %v), want (%v, %v)", tc.in, got, ok, tc.want, tc.ok)
			}
		})
	}
}

func TestIntFromParams(t *testing.T) {
	p := map[string]any{"dur": 30.9, "bad": "x"}
	if got := intFromParams(p, "dur"); got == nil || *got != 30 {
		t.Fatalf("intFromParams dur = %v, want 30 (truncated)", got)
	}
	if got := intFromParams(p, "bad"); got != nil {
		t.Fatalf("intFromParams bad = %v, want nil", *got)
	}
	if got := intFromParams(p, "absent"); got != nil {
		t.Fatalf("intFromParams absent = %v, want nil", *got)
	}
	if got := intFromParams(nil, "dur"); got != nil {
		t.Fatalf("intFromParams nil map = %v, want nil", *got)
	}
}
