"""Shared test helpers for pytest reporter tests"""


def create_config(project_root_value):
    """Helper to create a config object that returns a specific project root value"""
    class TestConfig:
        def getini(self, name):
            if name == 'tdd_guard_project_root':
                return project_root_value
            return ""
    return TestConfig()