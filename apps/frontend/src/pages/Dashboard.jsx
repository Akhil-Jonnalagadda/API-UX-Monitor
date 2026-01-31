import { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Table,
  Spinner,
  Alert,
  Badge,
  Button,
  ButtonGroup,
} from "react-bootstrap";
import { metricsApi, endpointsApi } from "../api/client";
import LatencyChart from "../components/charts/LatencyChart";

function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [timeseriesData, setTimeseriesData] = useState([]);
  const [latestChecks, setLatestChecks] = useState([]);
  const [period, setPeriod] = useState("24h");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    fetchLatestChecks();
  }, [period]);

  useEffect(() => {
    if (selectedEndpoint) {
      fetchTimeseriesData(selectedEndpoint);
    }
  }, [selectedEndpoint, period]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await metricsApi.getDashboard({ period });
      setDashboardData(response.data.data);

      // Auto-select first endpoint if none selected
      if (!selectedEndpoint && response.data.data.endpoints.length > 0) {
        setSelectedEndpoint(response.data.data.endpoints[0].endpointId);
      }

      setError(null);
    } catch (err) {
      setError("Failed to fetch dashboard data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeseriesData = async (endpointId) => {
    try {
      const periodMap = {
        "1h": Date.now() - 1 * 60 * 60 * 1000,
        "24h": Date.now() - 24 * 60 * 60 * 1000,
        "7d": Date.now() - 7 * 24 * 60 * 60 * 1000,
        "30d": Date.now() - 30 * 24 * 60 * 60 * 1000,
      };

      const response = await metricsApi.getTimeseries({
        endpointId,
        from: new Date(periodMap[period]).toISOString(),
        to: new Date().toISOString(),
      });
      setTimeseriesData(response.data.data);
    } catch (err) {
      console.error("Failed to fetch timeseries data:", err);
    }
  };

  const fetchLatestChecks = async () => {
    try {
      const response = await metricsApi.getLatest({ limit: 20 });
      setLatestChecks(response.data.data);
    } catch (err) {
      console.error("Failed to fetch latest checks:", err);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      UP: "success",
      DOWN: "danger",
      ERROR: "warning",
    };
    return <Badge bg={variants[status] || "secondary"}>{status}</Badge>;
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading && !dashboardData) {
    return (
      <div className="loading-container">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Dashboard</h2>
        <ButtonGroup>
          <Button
            variant={period === "1h" ? "primary" : "outline-primary"}
            onClick={() => setPeriod("1h")}
          >
            1H
          </Button>
          <Button
            variant={period === "24h" ? "primary" : "outline-primary"}
            onClick={() => setPeriod("24h")}
          >
            24H
          </Button>
          <Button
            variant={period === "7d" ? "primary" : "outline-primary"}
            onClick={() => setPeriod("7d")}
          >
            7D
          </Button>
          <Button
            variant={period === "30d" ? "primary" : "outline-primary"}
            onClick={() => setPeriod("30d")}
          >
            30D
          </Button>
        </ButtonGroup>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      {dashboardData && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="metric-card text-center">
              <Card.Body>
                <div className="label">Total Endpoints</div>
                <h3 className="text-primary">
                  {dashboardData.summary.totalEndpoints}
                </h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="metric-card text-center">
              <Card.Body>
                <div className="label">Active</div>
                <h3 className="text-success">
                  {dashboardData.summary.activeEndpoints}
                </h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="metric-card text-center">
              <Card.Body>
                <div className="label">Down</div>
                <h3 className="text-danger">
                  {dashboardData.summary.downEndpoints}
                </h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="metric-card text-center">
              <Card.Body>
                <div className="label">Overall Uptime</div>
                <h3 className="text-info">
                  {dashboardData.summary.overallUptime}%
                </h3>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Endpoint Selection and Chart */}
      <Row className="mb-4">
        <Col>
          {dashboardData && dashboardData.endpoints.length > 0 && (
            <div className="mb-3">
              <label className="form-label fw-bold">Select Endpoint:</label>
              <select
                className="form-select"
                value={selectedEndpoint || ""}
                onChange={(e) => setSelectedEndpoint(e.target.value)}
              >
                {dashboardData.endpoints.map((endpoint) => (
                  <option key={endpoint.endpointId} value={endpoint.endpointId}>
                    {endpoint.endpointName} - {endpoint.uptimePercentage}%
                    uptime
                  </option>
                ))}
              </select>
            </div>
          )}
          <LatencyChart data={timeseriesData} />
        </Col>
      </Row>

      {/* Latest Checks Table */}
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Latest Checks</h5>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Endpoint</th>
                    <th>Status</th>
                    <th>Latency</th>
                    <th>HTTP Status</th>
                    <th>Timestamp</th>
                    <th>Error</th>
                  </tr>
                </thead>
                <tbody>
                  {latestChecks.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center text-muted">
                        No check results yet. Checks will appear here once
                        monitoring starts.
                      </td>
                    </tr>
                  ) : (
                    latestChecks.map((check) => (
                      <tr key={check.id}>
                        <td>
                          <strong>{check.endpoint?.name}</strong>
                          <br />
                          <small className="text-muted">
                            {check.endpoint?.url}
                          </small>
                        </td>
                        <td>{getStatusBadge(check.status)}</td>
                        <td>
                          {check.latencyMs ? `${check.latencyMs}ms` : "-"}
                        </td>
                        <td>
                          {check.httpStatus && (
                            <Badge
                              bg={check.httpStatus < 400 ? "success" : "danger"}
                            >
                              {check.httpStatus}
                            </Badge>
                          )}
                        </td>
                        <td>{formatTimestamp(check.timestamp)}</td>
                        <td>
                          {check.errorMessage && (
                            <small className="text-danger">
                              {check.errorMessage}
                            </small>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Dashboard;
