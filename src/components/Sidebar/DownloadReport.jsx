import { FileText } from 'lucide-react';
import { getRiskColor } from '../../utils/riskColors';

export default function DownloadReport({ riskData }) {
  const handleDownload = () => {
    if (!riskData) return;

    const { location, risk, weather, elevation } = riskData;
    const date = new Date().toLocaleString();
    const color = getRiskColor(risk.level);

    // Create a new window for the report
    const printWindow = window.open('', '_blank');
    
    // Inject HTML content
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Flood Risk Report - ${location.name}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #333; }
            h1 { color: #1e3a8a; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
            .header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 30px; }
            .badge { 
              display: inline-block; padding: 8px 16px; border-radius: 6px; font-weight: bold; color: white;
              background-color: ${risk.level === 'HIGH' ? '#ef4444' : risk.level === 'MEDIUM' ? '#f59e0b' : '#22c55e'};
            }
            .section { margin-bottom: 30px; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
            .card { background: #f9fafb; border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; }
            .label { font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: bold; }
            .value { font-size: 18px; font-weight: 600; margin-top: 5px; }
            .footer { margin-top: 50px; font-size: 12px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px; }
            @media print {
              body { -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>Flood Risk Assessment Report</h1>
              <p>Location: <strong>${location.name}</strong></p>
              <p>Coordinates: ${location.lat}, ${location.lon}</p>
              <p>Generated: ${date}</p>
            </div>
            <div>
              <div class="badge">${risk.level} RISK - ${risk.percentage}%</div>
            </div>
          </div>
          
          <div class="section grid">
            <div class="card">
              <div class="label">Total Risk Score</div>
              <div class="value">${risk.score.toFixed(4)} / 1.0</div>
            </div>
            <div class="card">
              <div class="label">Elevation</div>
              <div class="value">${elevation.meters}m ASL</div>
            </div>
          </div>

          <div class="section">
            <h3>Weather Conditions</h3>
            <div class="grid">
              <div class="card">
                <div class="label">Rainfall (last hr)</div>
                <div class="value">${weather.precip_mm} mm</div>
              </div>
              <div class="card">
                <div class="label">Humidity</div>
                <div class="value">${weather.humidity}%</div>
              </div>
              <div class="card">
                <div class="label">Temperature</div>
                <div class="value">${weather.temp_c}°C</div>
              </div>
              <div class="card">
                <div class="label">Condition</div>
                <div class="value">${weather.condition}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <h3>Risk Breakdown</h3>
            <div class="grid">
              <div class="card">
                <div class="label">Rainfall Factor (50%)</div>
                <div class="value">${(risk.breakdown.rainfall.raw * 100).toFixed(1)}% severity</div>
              </div>
              <div class="card">
                <div class="label">Elevation Factor (30%)</div>
                <div class="value">${(risk.breakdown.elevation.raw * 100).toFixed(1)}% severity</div>
              </div>
              <div class="card">
                <div class="label">Historical Factor (20%)</div>
                <div class="value">${(risk.breakdown.historical.raw * 100).toFixed(1)}% severity</div>
              </div>
            </div>
          </div>

          <div class="footer">
            Report generated automatically by FloodSense AI Platform.<br/>
            Cognizant Blue Bolt Hackathon 2026.
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for styles to apply before printing
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <button
      onClick={handleDownload}
      disabled={!riskData}
      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg
                 bg-brand-600/20 text-brand-400 hover:bg-brand-600/30 border border-brand-500/30
                 transition-colors text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed mt-4"
    >
      <FileText className="w-4 h-4" />
      Download PDF Report
    </button>
  );
}
