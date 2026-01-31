import { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Badge,
  Spinner,
  Alert,
  ButtonGroup,
  Row,
  Col,
} from "react-bootstrap";
import { incidentsApi } from "../api/client";

function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [replayData, setReplayData] = useState(null);
  const [showReplayModal, setShowReplayModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, ongoing, resolved
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchIncidents();
    fetchStats();
  }, [filter]);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter === "ongoing") params.resolved = "false";
      if (filter === "resolved") params.resolved = "true";

      const response = await incidentsApi.getAll(params);
      setIncidents(response.data.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch incidents: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await incidentsApi.getStats({ period: "30d" });
      setStats(response.data.data);
    } catch (err) {
      console.error("Failed to fetch incident stats:", err);
    }
  };

  const handleResolve = async (id) => {
    try {
      await incidentsApi.resolve(id);
      setSuccess("Incident resolved successfully!");
      fetchIncidents();
      fetchStats();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to resolve incident: " + err.message);
    }
  };

  const handleViewReplay = async (incident) => {
    try {
      setSelectedIncident(incident);
      const response = await incidentsApi.getReplay(incident.id);
      setReplayData(response.data.data);
      setShowReplayModal(true);
    } catch (err) {
      setError("Failed to load incident replay: " + err.message);
    }
  };

  const getSeverityBadge = (severity) => {
    const variants = {
      critical: "danger",
      high: "warning",
      medium: "info",
      low: "secondary",
    };
    return (
      <Badge bg={variants[severity] || "secondary"}>
        {severity.toUpperCase()}
      </Badge>
    );
  };

  const getTypeBadge = (type) => {
    const labels = {
      downtime: "Downtime",
      latency_spike: "Latency Spike",
      error_rate: "Error Rate",
    };
    return <Badge bg="dark">{labels[type] || type}</Badge>;
  };

  const formatDuration = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const durationMs = end - start;

    const minutes = Math.floor(durationMs / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading && incidents.length === 0) {
    return (
      <div className="loading-container">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div className="incidents">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Incidents</h2>
        <ButtonGroup>
          <Button
            variant={filter === "all" ? "primary" : "outline-primary"}
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button
            variant={filter === "ongoing" ? "danger" : "outline-danger"}
            onClick={() => setFilter("ongoing")}
          >
            Ongoing
          </Button>
          <Button
            variant={filter === "resolved" ? "success" : "outline-success"}
            onClick={() => setFilter("resolved")}
          >
            Resolved
          </Button>
        </ButtonGroup>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Stats Cards */}
      {stats && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="metric-card text-center">
              <Card.Body>
                <div className="label">Total (30d)</div>
                <h3>{stats.total}</h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="metric-card text-center">
              <Card.Body>
                <div className="label">Ongoing</div>
                <h3 className="text-danger">{stats.ongoing}</h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="metric-card text-center">
              <Card.Body>
                <div className="label">Resolved</div>
                <h3 className="text-success">{stats.resolved}</h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="metric-card text-center">
              <Card.Body>
                <div className="label">Critical</div>
                <h3 className="text-warning">{stats.bySeverity.critical}</h3>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Incidents Table */}
      <Card>
        <Card.Body>
          <Table responsive hover>
            <thead>
              <tr>
                <th>Endpoint</th>
                <th>Type</th>
                <th>Severity</th>
                <th>Summary</th>
                <th>Start Time</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {incidents.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center text-muted">
                    No incidents found. This is good news! 🎉
                  </td>
                </tr>
              ) : (
                incidents.map((incident) => (
                  <tr key={incident.id}>
                    <td>
                      <strong>{incident.endpoint?.name}</strong>
                      <br />
                      <small className="text-muted">
                        {incident.endpoint?.url}
                      </small>
                    </td>
                    <td>{getTypeBadge(incident.type)}</td>
                    <td>{getSeverityBadge(incident.severity)}</td>
                    <td>{incident.summary}</td>
                    <td>{formatTimestamp(incident.startTime)}</td>
                    <td>
                      {formatDuration(incident.startTime, incident.endTime)}
                    </td>
                    <td>
                      {incident.resolved ? (
                        <Badge bg="success">Resolved</Badge>
                      ) : (
                        <Badge bg="danger">Ongoing</Badge>
                      )}
                    </td>
                    <td>
                      <ButtonGroup size="sm">
                        <Button
                          variant="outline-info"
                          onClick={() => handleViewReplay(incident)}
                        >
                          Replay
                        </Button>
                        {!incident.resolved && (
                          <Button
                            variant="outline-success"
                            onClick={() => handleResolve(incident.id)}
                          >
                            Resolve
                          </Button>
                        )}
                      </ButtonGroup>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Replay Modal */}
      <Modal
        show={showReplayModal}
        onHide={() => setShowReplayModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Incident Replay</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedIncident && (
            <div className="mb-3">
              <h5>{selectedIncident.summary}</h5>
              <p>
                <strong>Type:</strong> {getTypeBadge(selectedIncident.type)}{" "}
                <strong>Severity:</strong>{" "}
                {getSeverityBadge(selectedIncident.severity)}
              </p>
              <p>
                <strong>Start:</strong>{" "}
                {formatTimestamp(selectedIncident.startTime)}
                {selectedIncident.endTime && (
                  <>
                    <br />
                    <strong>End:</strong>{" "}
                    {formatTimestamp(selectedIncident.endTime)}
                  </>
                )}
              </p>
            </div>
          )}

          {replayData && (
            <div>
              <h6>Checks Around Incident Window</h6>
              <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                <Table striped bordered size="sm">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Status</th>
                      <th>Latency</th>
                      <th>HTTP Status</th>
                      <th>Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {replayData.checks.map((check) => (
                      <tr
                        key={check.id}
                        className={check.status !== "UP" ? "table-danger" : ""}
                      >
                        <td>{formatTimestamp(check.timestamp)}</td>
                        <td>
                          <Badge
                            bg={check.status === "UP" ? "success" : "danger"}
                          >
                            {check.status}
                          </Badge>
                        </td>
                        <td>
                          {check.latencyMs ? `${check.latencyMs}ms` : "-"}
                        </td>
                        <td>{check.httpStatus || "-"}</td>
                        <td>
                          {check.errorMessage && (
                            <small className="text-danger">
                              {check.errorMessage}
                            </small>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReplayModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Incidents;
