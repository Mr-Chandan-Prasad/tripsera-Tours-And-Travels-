import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, CreditCard, Download, Eye, Search, Filter, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useLocalStorageQuery } from '../hooks/useLocalStorage';
import TicketGenerator from '../components/booking/TicketGenerator';
import LoadingSpinner from '../components/common/LoadingSpinner';

const MyBookings: React.FC = () => {
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showTicket, setShowTicket] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const { data: bookings, loading } = useLocalStorageQuery('bookings', []);
  const { data: destinations } = useLocalStorageQuery('destinations', []);
  const { data: services } = useLocalStorageQuery('services', []);

  // Filter bookings based on customer authentication
  const customerBookings = bookings.filter(booking => 
    isAuthenticated && (
      (customerEmail.trim() && booking.email && booking.email.toLowerCase() === customerEmail.toLowerCase()) ||
      (customerMobile.trim() && booking.mobile && booking.mobile === customerMobile.trim())
    )
  );

  // Apply search and status filters
  const filteredBookings = customerBookings.filter(booking => {
    const matchesSearch = !searchQuery || 
      booking.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getDestinationName(booking.destination_id).toLowerCase().includes(searchQuery.toLowerCase()) ||
      getServiceName(booking.service_id).toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.payment_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getDestinationName = (destinationId: string) => {
    const destination = destinations.find(d => d.id === destinationId);
    return destination ? destination.name : 'Unknown Destination';
  };

  const getServiceName = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    return service ? service.name : 'Unknown Service';
  };

  const handleAuthentication = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    if (!customerEmail.trim() && !customerMobile.trim()) {
      alert('Please enter either email or mobile number');
      return;
    }
    
    // Check if any bookings exist for this customer
    const customerBookings = bookings.filter(booking => {
      const emailMatch = customerEmail.trim() && 
        booking.email && 
        booking.email.toLowerCase() === customerEmail.toLowerCase();
      const mobileMatch = customerMobile.trim() && 
        booking.mobile && 
        booking.mobile === customerMobile.trim();
      return emailMatch || mobileMatch;
    });
    
    if (customerBookings.length === 0) {
      alert('No bookings found for the provided email or mobile number. Please check your details or make a booking first.');
      return;
    }
    
    if (customerEmail.trim() || customerMobile.trim()) {
      setIsAuthenticated(true);
    } else {
      alert('Please enter valid email or mobile number');
    }
  };

  const handleViewTicket = (booking: any) => {
    setSelectedBooking(booking);
    setShowTicket(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">My Bookings</h1>
                <p className="text-gray-600">Enter your email or mobile number to view your bookings</p>
              </div>

              <form onSubmit={handleAuthentication} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>

                <div className="text-center text-gray-500">OR</div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={customerMobile}
                    onChange={(e) => setCustomerMobile(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter your mobile number"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!customerEmail.trim() && !customerMobile.trim()}
                  className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  View My Bookings
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  Don't have any bookings yet?{' '}
                  <a href="/bookings" className="text-orange-500 hover:text-orange-600 font-semibold">
                    Book Now
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">My Bookings</h1>
              <p className="text-gray-600">Manage and track your travel bookings</p>
            </div>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Switch Account
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bookings..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <Calendar className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-600 mb-2">No Bookings Found</h3>
            <p className="text-gray-500 mb-4">
              {customerBookings.length === 0 
                ? "You haven't made any bookings yet." 
                : "No bookings match your search criteria."
              }
            </p>
            <a
              href="/bookings"
              className="inline-block bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              Book Your First Trip
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-1">
                        {getDestinationName(booking.destination_id)}
                      </h3>
                      <p className="text-gray-600">{getServiceName(booking.service_id)}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(booking.payment_status)}
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(booking.payment_status)}`}>
                        {booking.payment_status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">{new Date(booking.booking_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">{booking.seats_selected || 1} {(booking.seats_selected || 1) === 1 ? 'Person' : 'People'}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <CreditCard className="w-4 h-4" />
                      <span className="text-sm">₹{(booking.amount || booking.total_amount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">Booking #{booking.id.slice(-6)}</span>
                    </div>
                  </div>

                  {booking.details && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        <strong>Special Requests:</strong> {booking.details}
                      </p>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    {booking.payment_status === 'paid' && (
                      <button
                        onClick={() => handleViewTicket(booking)}
                        className="flex-1 flex items-center justify-center space-x-2 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Ticket</span>
                      </button>
                    )}
                    
                    {booking.payment_status === 'pending' && (
                      <div className="flex-1 flex items-center justify-center space-x-2 bg-yellow-100 text-yellow-800 py-2 px-4 rounded-lg">
                        <Clock className="w-4 h-4" />
                        <span>Payment Pending</span>
                      </div>
                    )}
                    
                    {booking.payment_status === 'cancelled' && (
                      <div className="flex-1 flex items-center justify-center space-x-2 bg-red-100 text-red-800 py-2 px-4 rounded-lg">
                        <XCircle className="w-4 h-4" />
                        <span>Booking Cancelled</span>
                      </div>
                    )}
                    
                    <button
                      onClick={() => handleViewTicket(booking)}
                      className="flex items-center justify-center space-x-2 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 px-6 py-3">
                  <p className="text-xs text-gray-500">
                    Booked on {new Date(booking.created_at || Date.now()).toLocaleDateString()}
                    {booking.transaction_id && ` • Transaction: ${booking.transaction_id}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ticket Generator Modal */}
      {showTicket && selectedBooking && (
        <TicketGenerator
          bookingData={selectedBooking}
          destinationName={getDestinationName(selectedBooking.destination_id)}
          serviceName={getServiceName(selectedBooking.service_id)}
          onClose={() => {
            setShowTicket(false);
            setSelectedBooking(null);
          }}
        />
      )}
    </div>
  );
};

export default MyBookings;