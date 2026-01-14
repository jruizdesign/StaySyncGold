import React, { useState, useEffect } from 'react';
import { getProperties, createProperty, assignUserRole } from '../../services/admin';
import { getUsers } from '../../services/users';

const AdminControlCenterPage = () => {
  const [properties, setProperties] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [newProperty, setNewProperty] = useState({
    location: '',
    managerName: '',
    ownerName: '',
    phone_num: '',
  });

  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedPropertyForRole, setSelectedPropertyForRole] = useState('');


  useEffect(() => {
    const fetchData = async () => {
      try {
        const propertiesData = await getProperties();
        setProperties(propertiesData);
        const usersData = await getUsers();
        setUsers(usersData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreateProperty = async (e) => {
    e.preventDefault();
    try {
      const created = await createProperty(newProperty);
      setProperties([...properties, created]);
      setNewProperty({ location: '', managerName: '', ownerName: '', phone_num: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAssignRole = async (e) => {
    e.preventDefault();
    try {
      await assignUserRole(selectedUser, selectedRole, selectedPropertyForRole || null);
      alert('Role assigned successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-primary mb-4">Admin Control Center</h1>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">Create New Property</h2>
        <form onSubmit={handleCreateProperty} className="bg-white p-4 rounded-lg shadow-md">
          <input
            type="text"
            placeholder="Location"
            value={newProperty.location}
            onChange={(e) => setNewProperty({ ...newProperty, location: e.target.value })}
            className="border p-2 rounded mr-2 mb-2"
            required
          />
          <input
            type="text"
            placeholder="Manager Name"
            value={newProperty.managerName}
            onChange={(e) => setNewProperty({ ...newProperty, managerName: e.target.value })}
            className="border p-2 rounded mr-2 mb-2"
          />
          <input
            type="text"
            placeholder="Owner Name"
            value={newProperty.ownerName}
            onChange={(e) => setNewProperty({ ...newProperty, ownerName: e.target.value })}
            className="border p-2 rounded mr-2 mb-2"
          />
          <input
            type="text"
            placeholder="Phone Number"
            value={newProperty.phone_num}
            onChange={(e) => setNewProperty({ ...newProperty, phone_num: e.target.value })}
            className="border p-2 rounded mr-2 mb-2"
          />
          <button type="submit" className="bg-primary text-white px-4 py-2 rounded">
            Create Property
          </button>
        </form>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">Manage Properties</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="py-2">ID</th>
                <th className="py-2">Location</th>
                <th className="py-2">Manager</th>
                <th className="py-2">Owner</th>
                <th className="py-2">Phone</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((prop) => (
                <tr key={prop.id} className="text-center border-b">
                  <td className="py-2">{prop.id}</td>
                  <td className="py-2">{prop.location}</td>
                  <td className="py-2">{prop.managerName}</td>
                  <td className="py-2">{prop.ownerName}</td>
                  <td className="py-2">{prop.phone_num}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-2">Assign User Roles</h2>
        <form onSubmit={handleAssignRole} className="bg-white p-4 rounded-lg shadow-md">
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="border p-2 rounded mr-2 mb-2"
            required
          >
            <option value="">Select User</option>
            {/* Populate with actual users */}
            {users.map(user => <option key={user.id} value={user.id}>{user.first_name} {user.last_name} ({user.email})</option>)}
          </select>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="border p-2 rounded mr-2 mb-2"
            required
          >
            <option value="">Select Role</option>
            <option value="isAdmin">Admin</option>
            <option value="isManager">Manager</option>
            <option value="isOwner">Owner</option>
            <option value="isStaff">Staff</option>
          </select>
          <select
            value={selectedPropertyForRole}
            onChange={(e) => setSelectedPropertyForRole(e.target.value)}
            className="border p-2 rounded mr-2 mb-2"
          >
            <option value="">All Properties (Global Role)</option>
            {properties.map(prop => <option key={prop.id} value={prop.id}>{prop.location}</option>)}
          </select>
          <button type="submit" className="bg-primary text-white px-4 py-2 rounded">
            Assign Role
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminControlCenterPage;
