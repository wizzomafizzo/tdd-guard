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
