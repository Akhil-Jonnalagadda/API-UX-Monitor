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
import { endpointsApi } from "../api/client";

function Endpoints() {
  const [endpoints, setEndpoints] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    url: "",
    method: "GET",
    headers: "",
    body: "",
    expectedStatus: 200,
    scheduleSeconds: 30,
    enabled: true,
  });

  useEffect(() => {
    fetchEndpoints();
  }, []);

  const fetchEndpoints = async () => {
    try {
      setLoading(true);
      const response = await endpointsApi.getAll();
      setEndpoints(response.data.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch endpoints: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShowModal = (endpoint = null) => {
    if (endpoint) {
      setEditingEndpoint(endpoint);
      setFormData({
        name: endpoint.name,
        url: endpoint.url,
        method: endpoint.method,
        headers: endpoint.headers
          ? JSON.stringify(endpoint.headers, null, 2)
          : "",
        body: endpoint.body ? JSON.stringify(endpoint.body, null, 2) : "",
        expectedStatus: endpoint.expectedStatus,
        scheduleSeconds: endpoint.scheduleSeconds,
        enabled: endpoint.enabled,
      });
    } else {
      setEditingEndpoint(null);
      setFormData({
        name: "",
        url: "",
        method: "GET",
        headers: "",
        body: "",
        expectedStatus: 200,
        scheduleSeconds: 30,
        enabled: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEndpoint(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const parseJsonField = (value, fieldLabel) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    try {
      return JSON.parse(trimmed);
    } catch (error) {
      throw new Error(`${fieldLabel} must be valid JSON`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        name: formData.name,
        url: formData.url,
        method: formData.method,
        headers: parseJsonField(formData.headers, "Headers"),
        body: parseJsonField(formData.body, "Request Body"),
        expectedStatus: parseInt(formData.expectedStatus),
        scheduleSeconds: parseInt(formData.scheduleSeconds),
        enabled: formData.enabled,
      };

      if (editingEndpoint) {
        await endpointsApi.update(editingEndpoint.id, payload);
        setSuccess("Endpoint updated successfully!");
      } else {
        await endpointsApi.create(payload);
        setSuccess("Endpoint created successfully!");
      }

      handleCloseModal();
      fetchEndpoints();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(
        "Failed to save endpoint: " +
          (err.response?.data?.error || err.message),
      );
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this endpoint?")) {
      return;
    }

    try {
      await endpointsApi.delete(id);
      setSuccess("Endpoint deleted successfully!");
      fetchEndpoints();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to delete endpoint: " + err.message);
    }
  };

  const getStatusBadge = (enabled) => {
    return enabled ? (
      <Badge bg="success">Enabled</Badge>
    ) : (
      <Badge bg="secondary">Disabled</Badge>
    );
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
    <div className="endpoints">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Endpoints</h2>
        <Button variant="primary" onClick={() => handleShowModal()}>
          + Add Endpoint
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
                <th>URL</th>
                <th>Method</th>
                <th>Expected Status</th>
                <th>Check Interval</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {endpoints.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center text-muted">
                    No endpoints configured. Click "Add Endpoint" to get
                    started.
                  </td>
                </tr>
              ) : (
                endpoints.map((endpoint) => (
                  <tr key={endpoint.id}>
                    <td>
                      <strong>{endpoint.name}</strong>
                    </td>
                    <td>
                      <small className="text-muted">{endpoint.url}</small>
                    </td>
                    <td>
                      <Badge bg="info">{endpoint.method}</Badge>
                    </td>
                    <td>{endpoint.expectedStatus}</td>
                    <td>{endpoint.scheduleSeconds}s</td>
                    <td>{getStatusBadge(endpoint.enabled)}</td>
                    <td>
                      <ButtonGroup size="sm">
                        <Button
                          variant="outline-primary"
                          onClick={() => handleShowModal(endpoint)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline-danger"
                          onClick={() => handleDelete(endpoint.id)}
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
            {editingEndpoint ? "Edit Endpoint" : "Add New Endpoint"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Name *</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="My API Endpoint"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>URL *</Form.Label>
              <Form.Control
                type="url"
                name="url"
                value={formData.url}
                onChange={handleInputChange}
                required
                placeholder="https://api.example.com/health"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>HTTP Method</Form.Label>
              <Form.Select
                name="method"
                value={formData.method}
                onChange={handleInputChange}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
                <option value="HEAD">HEAD</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Headers (JSON)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="headers"
                value={formData.headers}
                onChange={handleInputChange}
                placeholder='{"Authorization": "Bearer token"}'
              />
              <Form.Text className="text-muted">
                Optional. Enter valid JSON for request headers.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Request Body (JSON)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="body"
                value={formData.body}
                onChange={handleInputChange}
                placeholder='{"key": "value"}'
              />
              <Form.Text className="text-muted">
                Optional. For POST, PUT, PATCH requests.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Expected Status Code</Form.Label>
              <Form.Control
                type="number"
                name="expectedStatus"
                value={formData.expectedStatus}
                onChange={handleInputChange}
                min="100"
                max="599"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Check Interval (seconds)</Form.Label>
              <Form.Control
                type="number"
                name="scheduleSeconds"
                value={formData.scheduleSeconds}
                onChange={handleInputChange}
                min="10"
                max="3600"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                name="enabled"
                label="Enabled (start monitoring immediately)"
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
              {editingEndpoint ? "Update" : "Create"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default Endpoints;
