"""Test configuration option for project root"""


def test_pytest_addoption_registers_tdd_guard_project_root(pytestconfig):
    """Test that tdd_guard_project_root ini option is registered"""
    # The option should be available in pytest config
    # This will raise ValueError if the option is not registered
    project_root = pytestconfig.getini('tdd_guard_project_root')
    
    # Default should be empty string
    assert project_root == ""