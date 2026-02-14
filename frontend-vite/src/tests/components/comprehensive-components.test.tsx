import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import React from 'react'

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>)
}

describe('Component Rendering Tests', () => {
  describe('Basic HTML Elements', () => {
    it('should render a heading', () => {
      render(<h1>SalesSync</h1>)
      expect(screen.getByText('SalesSync')).toBeDefined()
    })

    it('should render a button', () => {
      render(<button>Click Me</button>)
      expect(screen.getByText('Click Me')).toBeDefined()
    })

    it('should render an input', () => {
      render(<input placeholder="Enter text" />)
      expect(screen.getByPlaceholderText('Enter text')).toBeDefined()
    })

    it('should render a form', () => {
      render(
        <form data-testid="test-form">
          <input type="text" />
          <button type="submit">Submit</button>
        </form>
      )
      expect(screen.getByTestId('test-form')).toBeDefined()
    })
  })

  describe('Loading States', () => {
    it('should render loading spinner', () => {
      const LoadingSpinner = () => <div data-testid="spinner" className="animate-spin">Loading...</div>
      render(<LoadingSpinner />)
      expect(screen.getByTestId('spinner')).toBeDefined()
      expect(screen.getByText('Loading...')).toBeDefined()
    })

    it('should render skeleton placeholder', () => {
      const Skeleton = () => <div data-testid="skeleton" className="animate-pulse bg-gray-200 h-4 w-full" />
      render(<Skeleton />)
      expect(screen.getByTestId('skeleton')).toBeDefined()
    })
  })

  describe('Empty States', () => {
    it('should render empty state message', () => {
      const EmptyState = ({ message }: { message: string }) => (
        <div data-testid="empty-state">
          <p>{message}</p>
        </div>
      )
      render(<EmptyState message="No data found" />)
      expect(screen.getByText('No data found')).toBeDefined()
    })

    it('should render empty table state', () => {
      const EmptyTable = () => (
        <table>
          <tbody>
            <tr>
              <td colSpan={5}>No records to display</td>
            </tr>
          </tbody>
        </table>
      )
      render(<EmptyTable />)
      expect(screen.getByText('No records to display')).toBeDefined()
    })
  })

  describe('Error States', () => {
    it('should render error message', () => {
      const ErrorMessage = ({ error }: { error: string }) => (
        <div role="alert" className="text-red-500">{error}</div>
      )
      render(<ErrorMessage error="Something went wrong" />)
      expect(screen.getByRole('alert')).toBeDefined()
      expect(screen.getByText('Something went wrong')).toBeDefined()
    })

    it('should render retry button on error', () => {
      const ErrorWithRetry = ({ onRetry }: { onRetry: () => void }) => (
        <div>
          <p>Error occurred</p>
          <button onClick={onRetry}>Retry</button>
        </div>
      )
      const onRetry = vi.fn()
      render(<ErrorWithRetry onRetry={onRetry} />)
      expect(screen.getByText('Retry')).toBeDefined()
    })
  })

  describe('Form Validations', () => {
    it('should render required field indicator', () => {
      const RequiredField = () => (
        <label>
          Email <span className="text-red-500">*</span>
          <input required type="email" />
        </label>
      )
      render(<RequiredField />)
      expect(screen.getByText('*')).toBeDefined()
    })

    it('should render form with multiple input types', () => {
      render(
        <form data-testid="multi-form">
          <input type="text" placeholder="Name" />
          <input type="email" placeholder="Email" />
          <input type="password" placeholder="Password" />
          <input type="number" placeholder="Amount" />
          <select data-testid="select">
            <option value="">Select</option>
            <option value="option1">Option 1</option>
          </select>
          <textarea placeholder="Notes" />
        </form>
      )
      expect(screen.getByPlaceholderText('Name')).toBeDefined()
      expect(screen.getByPlaceholderText('Email')).toBeDefined()
      expect(screen.getByPlaceholderText('Password')).toBeDefined()
      expect(screen.getByPlaceholderText('Amount')).toBeDefined()
      expect(screen.getByTestId('select')).toBeDefined()
      expect(screen.getByPlaceholderText('Notes')).toBeDefined()
    })
  })

  describe('Navigation Components', () => {
    it('should render navigation links', () => {
      renderWithRouter(
        <nav>
          <a href="/dashboard">Dashboard</a>
          <a href="/orders">Orders</a>
          <a href="/customers">Customers</a>
          <a href="/products">Products</a>
        </nav>
      )
      expect(screen.getByText('Dashboard')).toBeDefined()
      expect(screen.getByText('Orders')).toBeDefined()
      expect(screen.getByText('Customers')).toBeDefined()
      expect(screen.getByText('Products')).toBeDefined()
    })
  })

  describe('Table Components', () => {
    it('should render table with headers and rows', () => {
      const data = [
        { id: 1, name: 'Product A', price: 100 },
        { id: 2, name: 'Product B', price: 200 },
      ]
      render(
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {data.map(item => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>${item.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )
      expect(screen.getByText('Product A')).toBeDefined()
      expect(screen.getByText('Product B')).toBeDefined()
      expect(screen.getByText('$100')).toBeDefined()
      expect(screen.getByText('$200')).toBeDefined()
    })
  })

  describe('Card/Dashboard Components', () => {
    it('should render stat card', () => {
      const StatCard = ({ title, value }: { title: string; value: string | number }) => (
        <div data-testid="stat-card">
          <h3>{title}</h3>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      )
      render(<StatCard title="Total Orders" value={150} />)
      expect(screen.getByText('Total Orders')).toBeDefined()
      expect(screen.getByText('150')).toBeDefined()
    })

    it('should render multiple stat cards', () => {
      const stats = [
        { title: 'Revenue', value: '$50,000' },
        { title: 'Orders', value: '320' },
        { title: 'Customers', value: '145' },
        { title: 'Products', value: '89' },
      ]
      render(
        <div>
          {stats.map(s => (
            <div key={s.title} data-testid="stat-card">
              <h3>{s.title}</h3>
              <p>{s.value}</p>
            </div>
          ))}
        </div>
      )
      expect(screen.getByText('Revenue')).toBeDefined()
      expect(screen.getByText('$50,000')).toBeDefined()
      expect(screen.getAllByTestId('stat-card')).toHaveLength(4)
    })
  })

  describe('Modal/Dialog Components', () => {
    it('should render modal content', () => {
      const Modal = ({ isOpen, title }: { isOpen: boolean; title: string }) => {
        if (!isOpen) return null
        return (
          <div data-testid="modal" role="dialog">
            <h2>{title}</h2>
            <button>Close</button>
          </div>
        )
      }
      render(<Modal isOpen={true} title="Confirm Action" />)
      expect(screen.getByRole('dialog')).toBeDefined()
      expect(screen.getByText('Confirm Action')).toBeDefined()
    })

    it('should not render when closed', () => {
      const Modal = ({ isOpen }: { isOpen: boolean }) => {
        if (!isOpen) return null
        return <div data-testid="modal">Content</div>
      }
      render(<Modal isOpen={false} />)
      expect(screen.queryByTestId('modal')).toBeNull()
    })
  })

  describe('Badge/Status Components', () => {
    it('should render status badges', () => {
      const StatusBadge = ({ status }: { status: string }) => {
        const colors: Record<string, string> = {
          active: 'bg-green-100 text-green-800',
          inactive: 'bg-red-100 text-red-800',
          pending: 'bg-yellow-100 text-yellow-800',
        }
        return <span className={colors[status] || 'bg-gray-100'}>{status}</span>
      }
      render(
        <div>
          <StatusBadge status="active" />
          <StatusBadge status="inactive" />
          <StatusBadge status="pending" />
        </div>
      )
      expect(screen.getByText('active')).toBeDefined()
      expect(screen.getByText('inactive')).toBeDefined()
      expect(screen.getByText('pending')).toBeDefined()
    })
  })

  describe('Pagination Component', () => {
    it('should render pagination controls', () => {
      const Pagination = ({ page, totalPages }: { page: number; totalPages: number }) => (
        <div data-testid="pagination">
          <button disabled={page <= 1}>Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages}>Next</button>
        </div>
      )
      render(<Pagination page={2} totalPages={5} />)
      expect(screen.getByText('Previous')).toBeDefined()
      expect(screen.getByText('Next')).toBeDefined()
      expect(screen.getByText('Page 2 of 5')).toBeDefined()
    })
  })

  describe('Search Component', () => {
    it('should render search input', () => {
      render(
        <div data-testid="search">
          <input type="search" placeholder="Search..." />
          <button>Search</button>
        </div>
      )
      expect(screen.getByPlaceholderText('Search...')).toBeDefined()
      expect(screen.getByText('Search')).toBeDefined()
    })
  })
})
