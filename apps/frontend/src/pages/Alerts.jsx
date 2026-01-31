import { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Badge,
  Spinner,
  Alert,
  ButtonGroup,
} from "react-bootstrap";
import { alertsApi, endpointsApi } from "../api/client";

function Alerts() {
  const [alertRules, setAlertRules] = useState([]);
  const [endpoints, setEndpoints] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    endpointId: "",
    ruleType: "latencyThreshold",
    threshold: "",
    windowSeconds: "",
    consecutiveFailures: "",
    errorRate: "",
    enabled: true,
  });

  useEffect(() => {
    fetchAlertRules();
    fetchEndpoints();
  }, []);

  const fetchAlertRules = async () => {
    try {
      setLoading(true);
      const response = await alertsApi.getAll();
      setAlertRules(response.data.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch alert rules: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchEndpoints = async () => {
    try {
      const response = await endpointsApi.getAll();
      setEndpoints(response.data.data);
    } catch (err) {
      console.error("Failed to fetch endpoints:", err);
    }
  };

  const handleShowModal = (rule = null) => {
    if (rule) {
      setEditingRule(rule);
      const config = rule.config || {};
      setFormData({
        name: rule.name,
        endpointId: rule.endpointId || "",
        ruleType: rule.ruleType,
        threshold: config.threshold || "",
        windowSeconds: config.windowSeconds || "",
        consecutiveFailures: config.consecutiveFailures || "",
        errorRate: config.errorRate || "",
        enabled: rule.enabled,
      });
    } else {
      setEditingRule(null);
      setFormData({
        name: "",
        endpointId: "",
        ruleType: "latencyThreshold",
        threshold: "",
        windowSeconds: "",
        consecutiveFailures: "",
        errorRate: "",
        enabled: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRule(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const buildConfig = () => {
    const {
      ruleType,
      threshold,
      windowSeconds,
      consecutiveFailures,
      errorRate,
    } = formData;

    switch (ruleType) {
      case "latencyThreshold":
        return {
          threshold: parseInt(threshold),
          windowSeconds: parseInt(windowSeconds),
        };
      case "consecutiveFailures":
        return {
          consecutiveFailures: parseInt(consecutiveFailures),
        };
      case "errorRateSpike":
        return {
          errorRate: parseFloat(errorRate),
          windowSeconds: parseInt(windowSeconds),
        };
      default:
        return {};
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        name: formData.name,
        endpointId: formData.endpointId || null,
        ruleType: formData.ruleType,
        config: buildConfig(),
        enabled: formData.enabled,
      };

      if (editingRule) {
        await alertsApi.update(editingRule.id, payload);
        setSuccess("Alert rule updated successfully!");
      } else {
        await alertsApi.create(payload);
        setSuccess("Alert rule created successfully!");
      }

      handleCloseModal();
      fetchAlertRules();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(
        "Failed to save alert rule: " +
          (err.response?.data?.error || err.message),
      );
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this alert rule?")) {
      return;
    }

    try {
      await alertsApi.delete(id);
      setSuccess("Alert rule deleted successfully!");
      fetchAlertRules();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to delete alert rule: " + err.message);
    }
  };

  const getRuleTypeLabel = (ruleType) => {
    const labels = {
      latencyThreshold: "Latency Threshold",
      consecutiveFailures: "Consecutive Failures",
      errorRateSpike: "Error Rate Spike",
    };
    return labels[ruleType] || ruleType;
  };

  const getConfigDisplay = (rule) => {
    const config = rule.config || {};
    switch (rule.ruleType) {
      case "latencyThreshold":
        return `> ${config.threshold}ms (${config.windowSeconds}s window)`;
      case "consecutiveFailures":
        return `${config.consecutiveFailures} failures`;
      case "errorRateSpike":
        return `${(config.errorRate * 100).toFixed(0)}% (${config.windowSeconds}s window)`;
      default:
        return JSON.stringify(config);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div className="alerts">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Alert Rules</h2>
        <Button variant="primary" onClick={() => handleShowModal()}>
          + Add Alert Rule
        </Button>
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

      <Card>
        <Card.Body>
          <Table responsive hover>
            <thead>
              <tr>
                <th>Name</th>
                <th>Endpoint</th>
                <th>Rule Type</th>
                <th>Configuration</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {alertRules.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-muted">
                    No alert rules configured. Click "Add Alert Rule" to create
                    one.
                  </td>
                </tr>
              ) : (
                alertRules.map((rule) => (
                  <tr key={rule.id}>
                    <td>
                      <strong>{rule.name}</strong>
                    </td>
                    <td>
                      {rule.endpoint ? (
                        <>
                          {rule.endpoint.name}
                          <br />
                          <small className="text-muted">
                            {rule.endpoint.url}
                          </small>
                        </>
                      ) : (
                        <Badge bg="secondary">Global</Badge>
                      )}
                    </td>
                    <td>
                      <Badge bg="info">{getRuleTypeLabel(rule.ruleType)}</Badge>
                    </td>
                    <td>
                      <small>{getConfigDisplay(rule)}</small>
                    </td>
                    <td>
                      {rule.enabled ? (
                        <Badge bg="success">Enabled</Badge>
                      ) : (
                        <Badge bg="secondary">Disabled</Badge>
                      )}
                    </td>
                    <td>
                      <ButtonGroup size="sm">
                        <Button
                          variant="outline-primary"
                          onClick={() => handleShowModal(rule)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline-danger"
                          onClick={() => handleDelete(rule.id)}
                        >
                          Delete
                        </Button>
                      </ButtonGroup>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingRule ? "Edit Alert Rule" : "Add Alert Rule"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Rule Name *</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="High Latency Alert"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Endpoint</Form.Label>
              <Form.Select
                name="endpointId"
                value={formData.endpointId}
                onChange={handleInputChange}
              >
                <option value="">All Endpoints (Global)</option>
                {endpoints.map((endpoint) => (
                  <option key={endpoint.id} value={endpoint.id}>
                    {endpoint.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Rule Type *</Form.Label>
              <Form.Select
                name="ruleType"
                value={formData.ruleType}
                onChange={handleInputChange}
                required
              >
                <option value="latencyThreshold">Latency Threshold</option>
                <option value="consecutiveFailures">
                  Consecutive Failures
                </option>
                <option value="errorRateSpike">Error Rate Spike</option>
              </Form.Select>
            </Form.Group>

            {/* Conditional fields based on rule type */}
            {formData.ruleType === "latencyThreshold" && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Latency Threshold (ms) *</Form.Label>
                  <Form.Control
                    type="number"
                    name="threshold"
                    value={formData.threshold}
                    onChange={handleInputChange}
                    required
                    placeholder="2000"
                  />
                  <Form.Text className="text-muted">
                    Alert when latency exceeds this value.
                  </Form.Text>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Time Window (seconds) *</Form.Label>
                  <Form.Control
                    type="number"
                    name="windowSeconds"
                    value={formData.windowSeconds}
                    onChange={handleInputChange}
                    required
                    placeholder="300"
                  />
                </Form.Group>
              </>
            )}

            {formData.ruleType === "consecutiveFailures" && (
              <Form.Group className="mb-3">
                <Form.Label>Number of Consecutive Failures *</Form.Label>
                <Form.Control
                  type="number"
                  name="consecutiveFailures"
                  value={formData.consecutiveFailures}
                  onChange={handleInputChange}
                  required
                  placeholder="3"
                  min="1"
                />
                <Form.Text className="text-muted">
                  Alert after this many consecutive failed checks.
                </Form.Text>
              </Form.Group>
            )}

            {formData.ruleType === "errorRateSpike" && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Error Rate Threshold (0-1) *</Form.Label>
                  <Form.Control
                    type="number"
                    name="errorRate"
                    value={formData.errorRate}
                    onChange={handleInputChange}
                    required
                    placeholder="0.5"
                    step="0.01"
                    min="0"
                    max="1"
                  />
                  <Form.Text className="text-muted">
                    Alert when error rate exceeds this (e.g., 0.5 = 50%).
                  </Form.Text>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Time Window (seconds) *</Form.Label>
                  <Form.Control
                    type="number"
                    name="windowSeconds"
                    value={formData.windowSeconds}
                    onChange={handleInputChange}
                    required
                    placeholder="600"
                  />
                </Form.Group>
              </>
            )}

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                name="enabled"
                label="Enabled"
                checked={formData.enabled}
                onChange={handleInputChange}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingRule ? "Update" : "Create"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default Alerts;
