import React from 'react';
import { Search } from 'lucide-react';
import { formatCurrency } from './utils';

const InvoiceSearch = ({ searchParams, onSearchChange, totals }) => {

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="grid grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 px-8">
            Name 
          </label>
          <div className="relative">
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 px-12 border rounded-md"
              value={searchParams.name}
              onChange={(e) => onSearchChange({ ...searchParams, name: e.target.value })}
              placeholder="Search by name..."
            />
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            className="w-full p-2 border rounded-md"
            value={searchParams.status}
            onChange={(e) => onSearchChange({ ...searchParams, status: e.target.value })}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="completed">Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date From
          </label>
          <input
            type="date"
            className="w-full p-2 border rounded-md"
            value={searchParams.dateFrom}
            onChange={(e) => onSearchChange({ ...searchParams, dateFrom: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date To
          </label>
          <input
            type="date"
            className="w-full p-2 border rounded-md"
            value={searchParams.dateTo}
            onChange={(e) => onSearchChange({ ...searchParams, dateTo: e.target.value })}
          />
        </div>
          
        
      </div>

      {/* Summary section */}
      <div className="mt-4 pt-4 border-t">
        <div className="text-sm text-gray-600">
          <span className="font-medium">Total found:</span>
          <span className="ml-2">{totals?.count || 0} invoices</span>
          <span className="ml-4 font-medium">Total amount:</span>
          <span className="ml-2">{formatCurrency(totals?.total || 0)}</span>
        </div>
      </div>
    </div>
  );
};

InvoiceSearch.defaultProps = {
  searchParams: {
    name: '',
    dateFrom: '',
    dateTo: '',
    status: 'all'
  },
  totals: {
    count: 0,
    total: 0
  }
};

export default InvoiceSearch;