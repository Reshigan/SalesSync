/**
 * Visit List Component
 * Displays tasks for the visit (surveys, board placement, product distribution)
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  CheckCircle,
  Circle,
  FileText,
  Camera,
  Package,
  AlertCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface Brand {
  id: string;
  brand_name: string;
}

interface Customer {
  id: string;
  store_name: string;
  owner_name: string;
}

interface Survey {
  id: string;
  survey_name: string;
  brand_id: string;
  brand_name: string;
  is_mandatory: boolean;
  questions_count: number;
  completed: boolean;
}

interface VisitTask {
  id: string;
  type: 'survey' | 'board' | 'product';
  title: string;
  description: string;
  brand_id?: string;
  brand_name?: string;
  is_mandatory: boolean;
  completed: boolean;
  icon: React.ReactNode;
}

export default function VisitList() {
  const navigate = useNavigate();
  const { customerId } = useParams<{ customerId: string }>();
  const location = useLocation();
  const customer = location.state?.customer as Customer | undefined;
  const brands = location.state?.brands as Brand[] | undefined;
  const gpsVerified = location.state?.gpsVerified as boolean | undefined;

  const [tasks, setTasks] = useState<VisitTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customer || !brands) {
      console.error('Required data not provided');
      navigate('/field-marketing/select-customer');
      return;
    }
    generateVisitTasks();
  }, [customer, brands, navigate]);

  const generateVisitTasks = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call to get surveys and tasks for selected brands
      // const response = await fieldMarketingService.getVisitTasks(customerId, brandIds);

      // Generate mock tasks
      const visitTasks: VisitTask[] = [];

      // Add survey tasks for each brand
      brands?.forEach((brand) => {
        visitTasks.push({
          id: `survey-${brand.id}`,
          type: 'survey',
          title: `${brand.brand_name} Survey`,
          description: 'Complete mandatory brand survey',
          brand_id: brand.id,
          brand_name: brand.brand_name,
          is_mandatory: true,
          completed: false,
          icon: <FileText className="w-5 h-5" />,
        });
      });

      // Add board placement task
      visitTasks.push({
        id: 'board-placement',
        type: 'board',
        title: 'Board Placement',
        description: 'Install or photograph brand boards',
        is_mandatory: true,
        completed: false,
        icon: <Camera className="w-5 h-5" />,
      });

      // Add product distribution task (optional)
      visitTasks.push({
        id: 'product-distribution',
        type: 'product',
        title: 'Product Distribution',
        description: 'Distribute SIM cards, phones, or other products',
        is_mandatory: false,
        completed: false,
        icon: <Package className="w-5 h-5" />,
      });

      setTasks(visitTasks);
    } catch (err) {
      setError('Failed to load visit tasks. Please try again.');
      console.error('Error generating visit tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskClick = (task: VisitTask) => {
    switch (task.type) {
      case 'survey':
        // TODO: Navigate to survey
        alert(`Survey feature - TODO: Navigate to ${task.title}`);
        break;
      case 'board':
        navigate(`/field-marketing/board-placement/${customerId}`, {
          state: { customer, brands, gpsVerified },
        });
        break;
      case 'product':
        navigate(`/field-marketing/product-distribution/${customerId}`, {
          state: { customer, brands, gpsVerified },
        });
        break;
    }
  };

  const handleCompleteVisit = () => {
    const incompleteMandatory = tasks.filter(
      (t) => t.is_mandatory && !t.completed
    );

    if (incompleteMandatory.length > 0) {
      alert(
        `Please complete all mandatory tasks:\n${incompleteMandatory
          .map((t) => `- ${t.title}`)
          .join('\n')}`
      );
      return;
    }

    navigate(`/field-marketing/visit-summary/${customerId}`, {
      state: { customer, brands, tasks, gpsVerified },
    });
  };

  const handleSkip = () => {
    navigate(`/field-marketing/visit-summary/${customerId}`, {
      state: { customer, brands, tasks, gpsVerified, incomplete: true },
    });
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const mandatoryCount = tasks.filter((t) => t.is_mandatory).length;
  const completedMandatoryCount = tasks.filter(
    (t) => t.is_mandatory && t.completed
  ).length;
  const progressPercentage = tasks.length
    ? Math.round((completedCount / tasks.length) * 100)
    : 0;

  if (!customer || !brands) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">Required information not found</p>
          <button
            onClick={() => navigate('/field-marketing/select-customer')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Customer Selection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Visit Tasks</h1>
        <p className="text-gray-600">Complete the following tasks for this visit</p>
      </div>

      {/* Customer & Brand Info */}
      <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg">
        <h3 className="font-semibold text-gray-900">{customer.store_name}</h3>
        <p className="text-sm text-gray-600 mb-2">{customer.owner_name}</p>
        <div className="flex flex-wrap gap-2">
          {brands.map((brand) => (
            <span
              key={brand.id}
              className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
            >
              {brand.brand_name}
            </span>
          ))}
        </div>
      </div>

      {/* GPS Warning */}
      {gpsVerified === false && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-900">
              Location Not Verified
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              This visit will be flagged for review
            </p>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">
            Progress: {completedCount} of {tasks.length} tasks
          </span>
          <span className="text-gray-600">{progressPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-gray-500">
            Mandatory: {completedMandatoryCount}/{mandatoryCount}
          </span>
          <span className="text-gray-500">
            Optional: {completedCount - completedMandatoryCount}/
            {tasks.length - mandatoryCount}
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
          <button
            onClick={generateVisitTasks}
            className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 bg-gray-100 rounded-lg animate-pulse h-24"
            />
          ))}
        </div>
      )}

      {/* Task List */}
      {!loading && tasks.length > 0 && (
        <div className="mb-6 space-y-3">
          {tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => handleTaskClick(task)}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                task.completed
                  ? 'border-green-500 bg-green-50'
                  : task.is_mandatory
                  ? 'border-red-200 bg-white hover:border-red-300'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-start">
                <div
                  className={`mr-3 mt-1 ${
                    task.completed ? 'text-green-600' : 'text-gray-400'
                  }`}
                >
                  {task.completed ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <Circle className="w-6 h-6" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <h3
                      className={`font-semibold ${
                        task.completed ? 'text-green-900' : 'text-gray-900'
                      }`}
                    >
                      {task.title}
                    </h3>
                    <div
                      className={`ml-2 ${
                        task.completed ? 'text-green-600' : 'text-gray-400'
                      }`}
                    >
                      {task.icon}
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-2">
                    {task.description}
                  </p>

                  <div className="flex items-center gap-2">
                    {task.is_mandatory && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                        Mandatory
                      </span>
                    )}
                    {!task.is_mandatory && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                        Optional
                      </span>
                    )}
                    {task.brand_name && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                        {task.brand_name}
                      </span>
                    )}
                    {task.completed && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Completed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={handleCompleteVisit}
          disabled={completedMandatoryCount < mandatoryCount}
          className={`w-full px-6 py-3 rounded-lg font-semibold flex items-center justify-center transition-colors ${
            completedMandatoryCount < mandatoryCount
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          Complete Visit
          <ArrowRight className="w-5 h-5 ml-2" />
        </button>

        {completedMandatoryCount < mandatoryCount && (
          <button
            onClick={handleSkip}
            className="w-full px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-semibold flex items-center justify-center"
          >
            <Clock className="w-5 h-5 mr-2" />
            Save Progress & Exit
          </button>
        )}

        <button
          onClick={() => navigate('/field-marketing/select-customer')}
          className="w-full px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
        >
          Cancel Visit
        </button>
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700 text-center">
          All mandatory tasks must be completed before finishing the visit
        </p>
      </div>
    </div>
  );
}
