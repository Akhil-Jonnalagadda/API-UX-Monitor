import { Link, useLocation } from "react-router-dom";
import { Navbar, Nav, Container } from "react-bootstrap";

function Navigation() {
  const location = useLocation();

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
      <Container fluid>
        <Navbar.Brand as={Link} to="/">
          <strong>📊 API UX Monitor</strong>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/" active={location.pathname === "/"}>
              Dashboard
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/endpoints"
              active={location.pathname === "/endpoints"}
            >
              Endpoints
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/incidents"
              active={location.pathname === "/incidents"}
            >
              Incidents
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/alerts"
              active={location.pathname === "/alerts"}
            >
              Alerts
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Navigation;
