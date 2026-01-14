import React, { useState, useEffect } from 'react';
import { getPayments } from '../../services/payments';

const BillingPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const data = await getPayments();
        setPayments(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-primary mb-4">Billing & Invoicing</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="w-1/6 py-2">ID</th>
              <th className="w-1/6 py-2">Reservation ID</th>
              <th className="w-1/6 py-2">Amount</th>
              <th className="w-1/4 py-2">Method</th>
              <th className="w-1/4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} className="text-center border-b">
                <td className="py-2">{payment.id}</td>
                <td className="py-2">{payment.res_id}</td>
                <td className="py-2">${payment.amount}</td>
                <td className="py-2">{payment.method}</td>
                <td className="py-2">{payment.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BillingPage;
