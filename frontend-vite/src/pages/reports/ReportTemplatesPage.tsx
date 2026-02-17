import React, { useState, useEffect } from 'react';
import { FileText, Play, Star } from 'lucide-react';
import { apiClient } from '../../services/api.service'

interface Template { id: number; name: string; description: string; category: string; popular: boolean; }

const ReportTemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await apiClient.get('/reports/templates');
      const raw = Array.isArray(res.data) ? res.data : (res.data?.data || res.data?.templates || []);
      setTemplates(raw.map((t: any) => ({
        id: Number(t.id || t.template_id),
        name: t.name || t.report_name || 'Untitled',
        description: t.description || '',
        category: t.category || t.report_type || 'General',
        popular: Boolean(t.popular || t.is_popular)
      })));
    } catch (err) {
      console.error('Failed to fetch report templates:', err);
    }
  };

  const runTemplate = async (templateId: number) => {
    try {
      const res = await apiClient.post(`/reports/templates/${templateId}/run`, {}, { responseType: 'blob' });
      if (res.data) {
        const blob = res.data;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${templateId}-${Date.now()}.xlsx`;
        a.click();
      }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="p-6 w-full">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2"><FileText className="w-8 h-8 text-purple-600" /> Report Templates</h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Popular Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.filter(t => t.popular).map(t => (
            <div key={t.id} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-3">
                <Star className="w-5 h-5 text-yellow-500 fill-current" />
                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded">{t.category}</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">{t.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{t.description}</p>
              <button onClick={() => runTemplate(t.id)} className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2">
                <Play className="w-4 h-4" /> Run Report
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">All Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.filter(t => !t.popular).map(t => (
            <div key={t.id} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">{t.category}</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">{t.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{t.description}</p>
              <button onClick={() => runTemplate(t.id)} className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2">
                <Play className="w-4 h-4" /> Run Report
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportTemplatesPage;
