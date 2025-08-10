package main

import (
	"bytes"
	"os"
	"path/filepath"
	"testing"

	"github.com/nizos/tdd-guard/reporters/go/internal/storage"
)

func TestProcess(t *testing.T) {
	// Setup temp directory for all tests
	oldWd, _ := os.Getwd()
	tempDir := t.TempDir()
	os.Chdir(tempDir)
	t.Cleanup(func() {
		os.Chdir(oldWd)
	})

	t.Run("without project root", func(t *testing.T) {
		t.Run("creates output file", func(t *testing.T) {
			runProcess(t, "")
			assertFileExists(t, tempDir)
		})
	})

	t.Run("with valid project root", func(t *testing.T) {
		t.Run("uses provided project root", func(t *testing.T) {
			runProcess(t, tempDir)
			assertFileExists(t, tempDir)
		})

		t.Run("parses and transforms input", func(t *testing.T) {
			runProcess(t, tempDir)

			outputPath := getTestFilePath(tempDir)
			data, _ := os.ReadFile(outputPath)

			// Check it contains expected transformed data
			if !bytes.Contains(data, []byte(`"state":"passed"`)) {
				t.Fatalf("Expected output to contain transformed test state, got: %s", data)
			}
		})

		t.Run("accepts project root equal to current directory", func(t *testing.T) {
			cwd, _ := os.Getwd()

			err := runProcess(t, cwd)
			if err != nil {
				t.Fatalf("Expected no error when project root equals cwd, got: %v", err)
			}

			assertFileExists(t, cwd)
		})

		t.Run("accepts project root as ancestor of current directory", func(t *testing.T) {
			// Create a subdirectory and change to it
			subDir := filepath.Join(tempDir, "subdir")
			os.MkdirAll(subDir, 0755)
			oldCwd, _ := os.Getwd()
			os.Chdir(subDir)
			defer os.Chdir(oldCwd)

			// Use tempDir (parent) as project root
			err := runProcess(t, tempDir)
			if err != nil {
				t.Fatalf("Expected no error when project root is ancestor, got: %v", err)
			}

			assertFileExists(t, tempDir)
		})
	})

	t.Run("project root validation", func(t *testing.T) {
		t.Run("rejects relative project root", func(t *testing.T) {
			err := runProcess(t, "../relative/path")
			assertErrorContains(t, err, "project root must be an absolute path")
		})

		t.Run("rejects project root outside current directory", func(t *testing.T) {
			outsideRoot := filepath.Join(filepath.Dir(tempDir), "outside")
			os.MkdirAll(outsideRoot, 0755)

			err := runProcess(t, outsideRoot)
			assertErrorContains(t, err, "current directory must be within project root")
		})
	})

	t.Run("compilation error handling", func(t *testing.T) {
		t.Run("produces non-empty output for compilation error", func(t *testing.T) {
			input := `# command-line-arguments`

			err := process(bytes.NewReader([]byte(input)), tempDir)
			if err != nil {
				t.Fatalf("Expected no error, got: %v", err)
			}

			outputPath := getTestFilePath(tempDir)
			data, _ := os.ReadFile(outputPath)

			if bytes.Contains(data, []byte(`"testModules":[]`)) {
				t.Fatalf("Expected non-empty testModules, got: %s", data)
			}
		})

		t.Run("only adds synthetic test for lines starting with #", func(t *testing.T) {
			input := `some random error text`
			err := process(bytes.NewReader([]byte(input)), tempDir)
			if err != nil {
				t.Fatal(err)
			}

			data, _ := os.ReadFile(getTestFilePath(tempDir))

			if !bytes.Contains(data, []byte(`"testModules":[]`)) {
				t.Fatalf("Expected empty testModules for non-# input, got: %s", data)
			}
		})

		t.Run("uses package name from compilation error", func(t *testing.T) {
			input := `# command-line-arguments`
			err := process(bytes.NewReader([]byte(input)), tempDir)
			if err != nil {
				t.Fatal(err)
			}

			data, _ := os.ReadFile(getTestFilePath(tempDir))

			if !bytes.Contains(data, []byte("command-line-arguments")) {
				t.Fatalf("Expected command-line-arguments in output, got: %s", data)
			}
		})

		t.Run("names the test CompilationError", func(t *testing.T) {
			input := `# command-line-arguments`
			err := process(bytes.NewReader([]byte(input)), tempDir)
			if err != nil {
				t.Fatal(err)
			}

			data, _ := os.ReadFile(getTestFilePath(tempDir))

			if !bytes.Contains(data, []byte("CompilationError")) {
				t.Fatalf("Expected CompilationError in output, got: %s", data)
			}
		})

		t.Run("includes compilation error message", func(t *testing.T) {
			input := `# command-line-arguments
single_import_error_test.go:5:2: no required module`
			err := process(bytes.NewReader([]byte(input)), tempDir)
			if err != nil {
				t.Fatal(err)
			}

			data, _ := os.ReadFile(getTestFilePath(tempDir))

			if !bytes.Contains(data, []byte("single_import_error_test.go:5:2")) {
				t.Fatalf("Expected error message in output, got: %s", data)
			}
		})

		t.Run("uses actual error message from input", func(t *testing.T) {
			input := `# command-line-arguments
main.go:10:5: undefined: SomeFunction`
			err := process(bytes.NewReader([]byte(input)), tempDir)
			if err != nil {
				t.Fatal(err)
			}

			data, _ := os.ReadFile(getTestFilePath(tempDir))

			if !bytes.Contains(data, []byte("main.go:10:5: undefined: SomeFunction")) {
				t.Fatalf("Expected actual error message in output, got: %s", data)
			}
		})
	})
}

// Test helpers
func runProcess(t *testing.T, projectRoot string) error {
	t.Helper()
	json := `{"Action":"pass","Package":"example.com/pkg","Test":"TestExample"}`
	return process(bytes.NewReader([]byte(json)), projectRoot)
}

func assertFileExists(t *testing.T, projectRoot string) {
	t.Helper()
	expectedPath := getTestFilePath(projectRoot)
	if _, err := os.Stat(expectedPath); os.IsNotExist(err) {
		t.Fatal("Expected output file to be created")
	}
}

func assertErrorContains(t *testing.T, err error, expected string) {
	t.Helper()
	if err == nil || err.Error() != expected {
		t.Fatalf("Expected error '%s', got: %v", expected, err)
	}
}

func getTestFilePath(projectRoot string) string {
	parts := append([]string{projectRoot}, storage.TestResultsPath...)
	return filepath.Join(parts...)
}
