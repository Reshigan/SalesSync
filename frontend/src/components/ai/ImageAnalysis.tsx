'use client'

import { useState, useRef } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  Camera, 
  Upload, 
  Zap, 
  CheckCircle, 
  AlertTriangle,
  Eye,
  BarChart3,
  Package,
  DollarSign,
  Loader2,
  X
} from 'lucide-react'

interface AnalysisResult {
  confidence: number
  category: string
  insights: string[]
  metrics: {
    shelfShare: number
    facingCount: number
    complianceScore: number
    priceAccuracy: number
  }
  issues: {
    type: 'warning' | 'error' | 'info'
    message: string
  }[]
  recommendations: string[]
}

interface ImageAnalysisProps {
  onAnalysisComplete?: (result: AnalysisResult) => void
  analysisType?: 'shelf' | 'promotion' | 'inventory' | 'general'
}

export function ImageAnalysis({ onAnalysisComplete, analysisType = 'general' }: ImageAnalysisProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (file: File) => {
    setSelectedImage(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
    setAnalysisResult(null)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleImageSelect(file)
    }
  }

  const analyzeImage = async () => {
    if (!selectedImage) return

    setIsAnalyzing(true)
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Mock analysis result
    const mockResult: AnalysisResult = {
      confidence: 0.92,
      category: analysisType,
      insights: [
        'Product placement follows planogram guidelines',
        'Competitor products detected in adjacent shelves',
        'Stock levels appear adequate for most SKUs',
        'Price tags are clearly visible and accurate'
      ],
      metrics: {
        shelfShare: 35.2,
        facingCount: 24,
        complianceScore: 87,
        priceAccuracy: 95
      },
      issues: [
        { type: 'warning', message: 'Low stock detected for Coca Cola 500ml' },
        { type: 'info', message: 'Competitor pricing is 5% higher' }
      ],
      recommendations: [
        'Restock Coca Cola 500ml within 2 hours',
        'Adjust pricing to match competitor levels',
        'Improve product facing alignment',
        'Add promotional materials to increase visibility'
      ]
    }

    setAnalysisResult(mockResult)
    setIsAnalyzing(false)
    onAnalysisComplete?.(mockResult)
  }

  const clearImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    setAnalysisResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      {/* Image Upload/Capture */}
      <Card>
        <Card.Header>
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold">AI Image Analysis</h3>
          </div>
        </Card.Header>
        <Card.Content>
          {!imagePreview ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <div className="space-y-4">
                <div className="flex justify-center space-x-4">
                  <Camera className="w-12 h-12 text-gray-400" />
                  <Upload className="w-12 h-12 text-gray-400" />
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    Upload or Capture Image
                  </h4>
                  <p className="text-gray-600 mb-4">
                    Take a photo or upload an image for AI-powered analysis
                  </p>
                </div>
                <div className="flex justify-center space-x-3">
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <Camera className="w-4 h-4 mr-2" />
                    Take Photo
                  </Button>
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Image
                  </Button>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Selected for analysis"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <button
                  onClick={clearImage}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex justify-center space-x-3">
                <Button
                  onClick={analyzeImage}
                  disabled={isAnalyzing}
                  className="min-w-32"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Analyze Image
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={clearImage}>
                  Clear Image
                </Button>
              </div>
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Analysis Results */}
      {analysisResult && (
        <div className="space-y-6">
          {/* Confidence Score */}
          <Card>
            <Card.Content className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Analysis Complete</h4>
                    <p className="text-sm text-gray-500">
                      Confidence: {(analysisResult.confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    {(analysisResult.confidence * 100).toFixed(0)}%
                  </p>
                  <p className="text-sm text-gray-500">Accuracy</p>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Metrics */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Shelf Share</p>
                  <p className="text-2xl font-bold">{analysisResult.metrics.shelfShare}%</p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-500" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Facings</p>
                  <p className="text-2xl font-bold">{analysisResult.metrics.facingCount}</p>
                </div>
                <Package className="w-8 h-8 text-green-500" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Compliance</p>
                  <p className="text-2xl font-bold">{analysisResult.metrics.complianceScore}%</p>
                </div>
                <CheckCircle className="w-8 h-8 text-purple-500" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Price Accuracy</p>
                  <p className="text-2xl font-bold">{analysisResult.metrics.priceAccuracy}%</p>
                </div>
                <DollarSign className="w-8 h-8 text-orange-500" />
              </div>
            </Card>
          </div>

          {/* Insights */}
          <Card>
            <Card.Header>
              <div className="flex items-center space-x-2">
                <Eye className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold">AI Insights</h3>
              </div>
            </Card.Header>
            <Card.Content>
              <div className="space-y-3">
                {analysisResult.insights.map((insight, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <p className="text-sm text-blue-800">{insight}</p>
                  </div>
                ))}
              </div>
            </Card.Content>
          </Card>

          {/* Recommendations */}
          <Card>
            <Card.Header>
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold">AI Recommendations</h3>
              </div>
            </Card.Header>
            <Card.Content>
              <div className="space-y-3">
                {analysisResult.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-medium text-green-600">{index + 1}</span>
                    </div>
                    <p className="text-sm text-green-800">{recommendation}</p>
                  </div>
                ))}
              </div>
            </Card.Content>
          </Card>
        </div>
      )}
    </div>
  )
}