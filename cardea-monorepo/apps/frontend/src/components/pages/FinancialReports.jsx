import React, { useState, useEffect } from 'react';
import { getFinancialReport } from '../../services/reports';

const FinancialReportsPage = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const data = await getFinancialReport();
        setReport(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-primary mb-4">Financial Reports</h1>
      {report ? (
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-lg"><strong>Report Date:</strong> {report.reportDate}</p>
          <p className="text-lg"><strong>Total Revenue:</strong> ${report.totalRevenue}</p>
          <p className="text-lg"><strong>Total Reservations:</strong> {report.totalReservations}</p>
          {/* More details here */}
        </div>
      ) : (
        <p>No financial report available.</p>
      )}
    </div>
  );
};

export default FinancialReportsPage;
