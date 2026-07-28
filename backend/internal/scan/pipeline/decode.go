package pipeline

import (
	"bytes"
	"errors"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"log"

	"lumo/backend/internal/config"
)

// ErrImageTooLarge means the image's DECODED bitmap would be too big. The byte
// cap upstream bounds the compressed payload only: a ~1MB PNG can declare
// 40000x40000, which is ~12.8 GB of pixels once decoded. Callers map this to a
// 4xx (the client sent a bad image), never a 500.
var ErrImageTooLarge = errors.New("image dimensions exceed limit")

// maxImageDim caps either side of the bitmap on its own, so a 1x4e8 strip is
// rejected as well as a square bomb.
const maxImageDim = 20000

// CheckImageBounds reads only the image HEADER (image.DecodeConfig allocates no
// pixels) and rejects a bitmap that would blow up memory when fully decoded.
// A non-image / unknown format returns the decode error, not ErrImageTooLarge.
func CheckImageBounds(imageBytes []byte) error {
	cfg, _, err := image.DecodeConfig(bytes.NewReader(imageBytes))
	if err != nil {
		return err
	}
	return checkDims(cfg.Width, cfg.Height)
}

// checkDims is the single pixel-budget rule. LUMO_MAX_IMAGE_PIXELS (default 40M
// — above any phone camera) bounds the total; maxImageDim bounds each side, and
// is checked first so w*h cannot overflow.
func checkDims(w, h int) error {
	if w <= 0 || h <= 0 || w > maxImageDim || h > maxImageDim {
		return ErrImageTooLarge
	}
	if w*h > config.EnvInt("LUMO_MAX_IMAGE_PIXELS", 40_000_000) {
		return ErrImageTooLarge
	}
	return nil
}

// decodeImage is the ONLY place untrusted bytes get fully decoded: the header
// bounds check runs first, and the decoded bitmap is re-checked in case a
// decoder hands back more than its header declared.
func decodeImage(imageBytes []byte) (image.Image, error) {
	if err := CheckImageBounds(imageBytes); err != nil {
		return nil, err
	}
	img, _, err := image.Decode(bytes.NewReader(imageBytes))
	if err != nil {
		return nil, err
	}
	b := img.Bounds()
	if err := checkDims(b.Dx(), b.Dy()); err != nil {
		return nil, err
	}
	return img, nil
}

// safeAssess runs passes 1+2 over untrusted bytes with panic containment: an
// image decoder that panics degrades that image to an empty result instead of
// killing the process (a panic in a detached/parallel goroutine is fatal).
// Never logs the image bytes.
func safeAssess(imageBytes []byte) (q QualityResult, g GeometryResult) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("scan pipeline: recovered panic decoding image: %v", r)
			g.Warnings = append(g.Warnings, "image processing failed")
		}
	}()
	return AssessQuality(imageBytes), AnalyseGeometry(imageBytes)
}
