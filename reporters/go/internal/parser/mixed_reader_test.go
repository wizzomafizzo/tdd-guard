package parser

import (
	"strings"
	"testing"
)

func TestMixedReader_PassesJSONToParser(t *testing.T) {
	input := `{"Action":"pass","Package":"example.com/pkg","Test":"TestExample"}`
	reader := strings.NewReader(input)

	mr := NewMixedReader(reader)
	jsonLines := mr.GetJSONLines()

	if len(jsonLines) != 1 {
		t.Fatalf("Expected 1 JSON line, got %d", len(jsonLines))
	}

	if jsonLines[0] != input {
		t.Errorf("Expected JSON line to be %q, got %q", input, jsonLines[0])
	}
}

func TestMixedReader_ReadsActualInput(t *testing.T) {
	input := `{"Action":"fail","Package":"test/pkg","Test":"TestFail"}`
	reader := strings.NewReader(input)

	mr := NewMixedReader(reader)
	jsonLines := mr.GetJSONLines()

	if jsonLines[0] != input {
		t.Errorf("Expected JSON line to be %q, got %q", input, jsonLines[0])
	}
}

func TestMixedReader_BuffersNonJSONLines(t *testing.T) {
	input := "# command-line-arguments\n"
	reader := strings.NewReader(input)

	mr := NewMixedReader(reader)
	nonJSON := mr.GetNonJSONLines()

	if len(nonJSON) != 1 {
		t.Fatalf("Expected 1 non-JSON line, got %d", len(nonJSON))
	}

	if nonJSON[0] != "# command-line-arguments" {
		t.Errorf("Expected non-JSON line to be %q, got %q", "# command-line-arguments", nonJSON[0])
	}
}

func TestMixedReader_SeparatesJSONFromNonJSON(t *testing.T) {
	input := `{"Action":"pass","Package":"test"}
# error line
{"Action":"fail","Package":"test2"}`
	reader := strings.NewReader(input)

	mr := NewMixedReader(reader)
	jsonLines := mr.GetJSONLines()
	nonJSON := mr.GetNonJSONLines()

	if len(jsonLines) != 2 {
		t.Fatalf("Expected 2 JSON lines, got %d", len(jsonLines))
	}

	if len(nonJSON) != 1 {
		t.Fatalf("Expected 1 non-JSON line, got %d", len(nonJSON))
	}

	if nonJSON[0] != "# error line" {
		t.Errorf("Expected non-JSON line to be %q, got %q", "# error line", nonJSON[0])
	}
}

func TestMixedReader_DetectsCompilationError(t *testing.T) {
	input := `# command-line-arguments
single_import_error_test.go:5:2: no required module provides package github.com/non-existent/module
FAIL	command-line-arguments [setup failed]`
	reader := strings.NewReader(input)

	mr := NewMixedReader(reader)

	if !mr.HasCompilationError() {
		t.Fatal("Expected compilation error to be detected")
	}
}

func TestMixedReader_NoCompilationErrorForNormalOutput(t *testing.T) {
	input := `{"Action":"pass","Package":"test","Test":"TestSomething"}`
	reader := strings.NewReader(input)

	mr := NewMixedReader(reader)

	if mr.HasCompilationError() {
		t.Fatal("Expected no compilation error for normal JSON output")
	}
}

func TestMixedReader_ExtractsPackageName(t *testing.T) {
	input := `# command-line-arguments
single_import_error_test.go:5:2: no required module provides package github.com/non-existent/module
FAIL	command-line-arguments [setup failed]`
	reader := strings.NewReader(input)

	mr := NewMixedReader(reader)

	pkg := mr.GetCompilationErrorPackage()
	if pkg != "command-line-arguments" {
		t.Errorf("Expected package name %q, got %q", "command-line-arguments", pkg)
	}
}

func TestMixedReader_ExtractsDifferentPackageName(t *testing.T) {
	input := `# github.com/example/pkg
error.go:10:5: undefined: SomeFunction`
	reader := strings.NewReader(input)

	mr := NewMixedReader(reader)

	pkg := mr.GetCompilationErrorPackage()
	if pkg != "github.com/example/pkg" {
		t.Errorf("Expected package name %q, got %q", "github.com/example/pkg", pkg)
	}
}

func TestMixedReader_GetCompilationErrorMessage(t *testing.T) {
	input := `# command-line-arguments
single_import_error_test.go:5:2: no required module provides package github.com/non-existent/module
FAIL	command-line-arguments [setup failed]`
	reader := strings.NewReader(input)

	mr := NewMixedReader(reader)

	msg := mr.GetCompilationErrorMessage()
	expected := "single_import_error_test.go:5:2: no required module provides package github.com/non-existent/module"
	if msg != expected {
		t.Errorf("Expected error message %q, got %q", expected, msg)
	}
}

func TestMixedReader_GetDifferentCompilationErrorMessage(t *testing.T) {
	input := `# github.com/example/pkg
main.go:10:5: undefined: SomeFunction`
	reader := strings.NewReader(input)

	mr := NewMixedReader(reader)

	msg := mr.GetCompilationErrorMessage()
	expected := "main.go:10:5: undefined: SomeFunction"
	if msg != expected {
		t.Errorf("Expected error message %q, got %q", expected, msg)
	}
}
