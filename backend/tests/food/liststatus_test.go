package foodtests

import (
	"net/http"
	"testing"

	"lume/backend/internal/food"
)

// statusOf returns the number of logs with the given status in a decoded list.
func countStatus(logs []food.Log, status string) int {
	n := 0
	for _, l := range logs {
		if l.Status == status {
			n++
		}
	}
	return n
}

func seedStatusLogs(f *fakeStore) {
	f.logs = append(f.logs,
		food.Log{UserID: "user_1", Date: "2026-07-11", FoodName: "A", Calories: 100, Status: "analyzing"},
		food.Log{UserID: "user_1", Date: "2026-07-11", FoodName: "B", Calories: 200, Status: "analyzing"},
		food.Log{UserID: "user_1", Date: "2026-07-11", FoodName: "C", Calories: 300, Status: "confirmed"},
	)
}

func TestListLogsStatusFilter(t *testing.T) {
	f := &fakeStore{}
	seedStatusLogs(f)
	rr := do(t, newMux(f, nil), "GET", "/api/food/logs?status=analyzing", "user_1", nil)
	if rr.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (body %s)", rr.Code, rr.Body.String())
	}
	logs := data[[]food.Log](t, rr)
	if len(logs) != 2 || countStatus(logs, "analyzing") != 2 {
		t.Errorf("status=analyzing should return the 2 analyzing logs, got %+v", logs)
	}
}

func TestListLogsNoStatusReturnsAll(t *testing.T) {
	f := &fakeStore{}
	seedStatusLogs(f)
	rr := do(t, newMux(f, nil), "GET", "/api/food/logs", "user_1", nil)
	logs := data[[]food.Log](t, rr)
	if len(logs) != 3 {
		t.Errorf("no status filter should return all 3 logs, got %d: %+v", len(logs), logs)
	}
}

func TestListLogsAnalyzingAppearsInPlainList(t *testing.T) {
	f := &fakeStore{}
	seedStatusLogs(f)
	rr := do(t, newMux(f, nil), "GET", "/api/food/logs", "user_1", nil)
	if countStatus(data[[]food.Log](t, rr), "analyzing") != 2 {
		t.Error("analyzing logs must appear in the plain (unfiltered) list")
	}
}
