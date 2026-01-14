import React, { useState, useEffect } from 'react';
import { getStaff } from '../../services/staff';

const StaffManagementPage = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const data = await getStaff();
        setStaff(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-primary mb-4">Staff Management</h1>
      {/* Add staff form will go here */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="w-1/6 py-2">ID</th>
              <th className="w-1/4 py-2">First Name</th>
              <th className="w-1/4 py-2">Last Name</th>
              <th className="w-1/3 py-2">Role</th>
              <th className="w-1/4 py-2">Phone</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((member) => (
              <tr key={member.id} className="text-center border-b">
                <td className="py-2">{member.id}</td>
                <td className="py-2">{member.firstname}</td>
                <td className="py-2">{member.last_name}</td>
                <td className="py-2">{member.role}</td>
                <td className="py-2">{member.phone_num}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StaffManagementPage;
