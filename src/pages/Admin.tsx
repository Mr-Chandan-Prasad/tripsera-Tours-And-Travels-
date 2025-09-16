import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  MapPin,
  Settings,
  CreditCard,
  Image,
  MessageSquare,
  Star,
  Gift,
  Mail,
  Plus,
  Edit,
  Trash2,
  Download,
  Search,
  Save,
  X,
  Upload,
  Eye,
  Calendar,
  Filter,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { useSupabaseQuery, useSupabaseMutation } from '../hooks/useSupabase';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PaymentHistory from '../components/payment/PaymentHistory';
import AddOnsManager from '../components/admin/AddOnsManager';

const Admin: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState({
    username: '',
    password: ''
  });
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [exportFilter, setExportFilter] = useState('all');
  const [qrCodeData, setQrCodeData] = useState('');

  // Data hooks
  const { data: bookings, refetch: refetchBookings } = useSupabaseQuery('bookings', '*');
  const { data: destinations, refetch: refetchDestinations } = useSupabaseQuery('destinations', '*');
  const { data: services, refetch: refetchServices } = useSupabaseQuery('services', '*');
  const { data: gallery, refetch: refetchGallery } = useSupabaseQuery('gallery', '*');
  const { data: testimonials, refetch: refetchTestimonials } = useSupabaseQuery('testimonials', '*');
  const { data: advertisements, refetch: refetchAds } = useSupabaseQuery('advertisements', '*');
  const { data: offers, refetch: refetchOffers } = useSupabaseQuery('offers', '*');
  const { data: inquiries, refetch: refetchInquiries } = useSupabaseQuery('inquiries', '*');
  const { data: siteSettings, refetch: refetchSiteSettings } = useSupabaseQuery('site_settings', '*');

  const { insert, update, remove, loading: mutationLoading } = useSupabaseMutation();

  // Admin authentication
  const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'chandanprasad2025'
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (adminCredentials.username === ADMIN_CREDENTIALS.username &&
      adminCredentials.password === ADMIN_CREDENTIALS.password) {
      setIsAuthenticated(true);
      // Store authentication in sessionStorage for session persistence
      sessionStorage.setItem('adminAuthenticated', 'true');
    } else {
      setLoginError('Invalid username or password');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('adminAuthenticated');
    setAdminCredentials({ username: '', password: '' });
  };

  // Check for existing authentication on component mount
  useEffect(() => {
    const isAuth = sessionStorage.getItem('adminAuthenticated');
    if (isAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Load QR code data
  useEffect(() => {
    const savedQrCode = localStorage.getItem('paymentQrCodeData') || '';
    setQrCodeData(savedQrCode);
  }, []);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Shield },
    { id: 'bookings', label: 'Bookings', icon: Users },
    { id: 'destinations', label: 'Destinations', icon: MapPin },
    { id: 'services', label: 'Services', icon: Settings },
    { id: 'addons', label: 'Add-Ons', icon: Gift },
    { id: 'gallery', label: 'Gallery', icon: Image },
    { id: 'testimonials', label: 'Testimonials', icon: MessageSquare },
    { id: 'advertisements', label: 'Ads', icon: Star },
    { id: 'offers', label: 'Offers', icon: Gift },
    { id: 'inquiries', label: 'Inquiries', icon: Mail },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'qr-settings', label: 'QR Settings', icon: Settings },
  ];

  const stats = {
    totalBookings: bookings.length,
    pendingBookings: bookings.filter(b => b.payment_status === 'pending').length,
    paidBookings: bookings.filter(b => b.payment_status === 'paid').length,
    totalRevenue: bookings.filter(b => b.payment_status === 'paid').reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0),
    totalDestinations: destinations.length,
    totalServices: services.length,
    totalInquiries: inquiries.length,
  };

  const getDestinationName = (destinationId: string) => {
    const destination = destinations.find(d => d.id === destinationId);
    return destination ? destination.name : 'Unknown Destination';
  };

  const getServiceName = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    return service ? service.name : 'Unknown Service';
  };

  const handleDelete = async (table: string, id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await remove(table, id);
        // Refetch data based on table
        switch (table) {
          case 'bookings': refetchBookings(); break;
          case 'destinations': refetchDestinations(); break;
          case 'services': refetchServices(); break;
          case 'gallery': refetchGallery(); break;
          case 'testimonials': refetchTestimonials(); break;
          case 'advertisements': refetchAds(); break;
          case 'offers': refetchOffers(); break;
          case 'inquiries': refetchInquiries(); break;
        }
        alert('Item deleted successfully!');
      } catch (error) {
        alert('Error deleting item');
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await update(activeTab, editingItem.id, formData);
      } else {
        await insert(activeTab, formData);
      }

      // Refetch data
      switch (activeTab) {
        case 'destinations': refetchDestinations(); break;
        case 'services': refetchServices(); break;
        case 'gallery': refetchGallery(); break;
        case 'testimonials': refetchTestimonials(); break;
        case 'advertisements': refetchAds(); break;
        case 'offers': refetchOffers(); break;
      }

      setEditingItem(null);
      setShowForm(false);
      setFormData({});
      alert('Item saved successfully!');
    } catch (error) {
      alert('Error saving item');
    }
  };

  const updatePaymentStatus = async (bookingId: string, status: 'pending' | 'paid' | 'cancelled') => {
    try {
      await update('bookings', bookingId, { payment_status: status });
      refetchBookings();
      alert('Payment status updated successfully!');
    } catch (error) {
      alert('Error updating payment status');
    }
  };

  const exportBookings = (filter: string) => {
    let filteredBookings = [...bookings];
    const now = new Date();

    switch (filter) {
      case 'today':
        filteredBookings = bookings.filter(booking => {
          const bookingDate = new Date(booking.created_at || Date.now());
          return bookingDate.toDateString() === now.toDateString();
        });
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredBookings = bookings.filter(booking => {
          const bookingDate = new Date(booking.created_at || Date.now());
          return bookingDate >= weekAgo;
        });
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filteredBookings = bookings.filter(booking => {
          const bookingDate = new Date(booking.created_at || Date.now());
          return bookingDate >= monthAgo;
        });
        break;
    }

    if (filteredBookings.length === 0) {
      alert('No bookings found for the selected period');
      return;
    }

    const csvData = filteredBookings.map(booking => ({
      'Booking ID': booking.id,
      'Customer Name': booking.customer_name,
      'Email': booking.email,
      'Mobile': booking.mobile,
      'Destination': getDestinationName(booking.destination_id),
      'Service': getServiceName(booking.service_id),
      'Amount': booking.amount,
      'Payment Status': booking.payment_status,
      'Booking Date': booking.booking_date,
      'Created At': new Date(booking.created_at || Date.now()).toLocaleDateString()
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings_${filter}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveQrCode = () => {
    localStorage.setItem('paymentQrCodeData', qrCodeData);
    alert('QR Code updated successfully!');
  };

  const openForm = (item?: any) => {
    setEditingItem(item || null);
    setFormData(item || {});
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormData({});
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">Dashboard Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Bookings</p>
              <p className="text-3xl font-bold">{stats.totalBookings}</p>
            </div>
            <Users className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Pending Bookings</p>
              <p className="text-3xl font-bold">{stats.pendingBookings}</p>
            </div>
            <Clock className="w-12 h-12 text-orange-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Paid Bookings</p>
              <p className="text-3xl font-bold">{stats.paidBookings}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Total Revenue</p>
              <p className="text-3xl font-bold">₹{stats.totalRevenue.toLocaleString()}</p>
            </div>
            <CreditCard className="w-12 h-12 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Bookings</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Customer</th>
                <th className="text-left py-2">Destination</th>
                <th className="text-left py-2">Service</th>
                <th className="text-left py-2">Amount</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {bookings.slice(0, 5).map((booking) => (
                <tr key={booking.id} className="border-b">
                  <td className="py-2">{booking.customer_name}</td>
                  <td className="py-2">{getDestinationName(booking.destination_id)}</td>
                  <td className="py-2">{getServiceName(booking.service_id)}</td>
                  <td className="py-2">₹{(booking.amount || 0).toLocaleString()}</td>
                  <td className="py-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${booking.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                        booking.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                      }`}>
                      {booking.payment_status}
                    </span>
                  </td>
                  <td className="py-2">{new Date(booking.created_at || Date.now()).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderBookingsTable = () => {
    const filteredBookings = bookings.filter(booking =>
      Object.values(booking).some(value =>
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      getDestinationName(booking.destination_id).toLowerCase().includes(searchQuery.toLowerCase()) ||
      getServiceName(booking.service_id).toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-800">Bookings Management</h2>
          <div className="flex space-x-2">
            <select
              value={exportFilter}
              onChange={(e) => setExportFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Bookings</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            <button
              onClick={() => exportBookings(exportFilter)}
              className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bookings..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Customer</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Contact</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Destination</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Service</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Payment Proof</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-semibold">{booking.customer_name}</div>
                        <div className="text-sm text-gray-500">{booking.email}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <div>{booking.mobile}</div>
                        <div className="text-gray-500">{booking.address?.substring(0, 30)}...</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">{getDestinationName(booking.destination_id)}</td>
                    <td className="py-3 px-4">{getServiceName(booking.service_id)}</td>
                    <td className="py-3 px-4">₹{(booking.amount || 0).toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <select
                        value={booking.payment_status}
                        onChange={(e) => updatePaymentStatus(booking.id, e.target.value as any)}
                        className={`px-2 py-1 rounded-full text-xs border-0 ${booking.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                            booking.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                          }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      {booking.payment_proof_url ? (
                        <button
                          onClick={() => setSelectedImage(booking.payment_proof_url)}
                          className="text-blue-500 hover:text-blue-700 p-1 rounded"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">No proof</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleDelete('bookings', booking.id)}
                        className="text-red-500 hover:text-red-700 p-1 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderQrSettings = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">Payment QR Code Settings</h2>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-4">Upload QR Code</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  QR Code Image URL or Base64
                </label>
                <textarea
                  value={qrCodeData}
                  onChange={(e) => setQrCodeData(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Paste image URL or base64 data here..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or upload image file
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setQrCodeData(event.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={saveQrCode}
                className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Save QR Code
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">Preview</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              {qrCodeData ? (
                <img
                  src={qrCodeData}
                  alt="Payment QR Code"
                  className="max-w-full max-h-64 mx-auto rounded-lg shadow-lg"
                />
              ) : (
                <div className="text-gray-500">
                  <Upload className="w-16 h-16 mx-auto mb-4" />
                  <p>No QR code uploaded</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const getFormFields = () => {
    switch (activeTab) {
      case 'destinations':
        return [
          { name: 'name', label: 'Name', type: 'text', required: true },
          { name: 'description', label: 'Description', type: 'textarea' },
          {
            name: 'category', label: 'Category', type: 'select', options: [
              'adventure', 'beach', 'mountain', 'cultural', 'religious', 'wildlife', 'romantic', 'family'
            ]
          },
          { name: 'tags', label: 'Tags (comma separated)', type: 'text' },
          { name: 'image_url', label: 'Primary Image URL', type: 'url' }, // Label changed for clarity
          { name: 'gallery_images', label: 'Additional Image URLs (comma separated)', type: 'textarea' }, // ADDED LINE
          { name: 'price', label: 'Price', type: 'number', required: true },
          { name: 'rating', label: 'Rating (1-5)', type: 'number', min: 1, max: 5 }, // ADDED LINE
          { name: 'inclusions', label: 'Inclusions', type: 'textarea' }, // ADDED LINE
          { name: 'exclusions', label: 'Exclusions', type: 'textarea' }, // ADDED LINE
          { name: 'itinerary', label: 'Itinerary (Day 1:..., Day 2:...)', type: 'textarea' }, // ADDED LINE
        ];
      case 'services':
        return [
          { name: 'name', label: 'Name', type: 'text', required: true },
          { name: 'description', label: 'Description', type: 'textarea' },
          { name: 'image_url', label: 'Image URL', type: 'url' },
          { name: 'price', label: 'Price', type: 'number', required: true },
        ];
      case 'gallery':
        return [
          { name: 'title', label: 'Title', type: 'text', required: true },
          { name: 'image_url', label: 'Image URL', type: 'url', required: true },
        ];
      case 'testimonials':
        return [
          { name: 'author', label: 'Author', type: 'text', required: true },
          { name: 'text', label: 'Testimonial', type: 'textarea', required: true },
        ];
      case 'advertisements':
        return [
          { name: 'title', label: 'Title', type: 'text', required: true },
          { name: 'description', label: 'Description', type: 'textarea', required: true },
          { name: 'image_url', label: 'Image URL', type: 'url', required: true },
        ];
      case 'offers':
        return [
          { name: 'title', label: 'Offer Title', type: 'text', required: true },
          { name: 'description', label: 'Description', type: 'textarea', required: true },
          { name: 'original_price', label: 'Original Price', type: 'number', required: true },
          { name: 'price', label: 'Offer Price', type: 'number', required: true },
          { name: 'discount_percentage', label: 'Discount %', type: 'number' },
          { name: 'valid_until', label: 'Valid Until', type: 'date' },
          { name: 'tags', label: 'Tags (comma separated)', type: 'text' },
          { name: 'image_url', label: 'Banner Image URL', type: 'url', required: true },
        ];
      default:
        return [];
    }
  };

  const renderDataTable = (data: any[], columns: string[], tableName: string) => {
    const filteredData = data.filter(item =>
      Object.values(item).some(value =>
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      )
    );

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-800 capitalize">{tableName}</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => exportData(data, tableName)}
              className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            {!['bookings', 'inquiries', 'payments'].includes(tableName) && (
              <button
                onClick={() => openForm()}
                className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add New</span>
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${tableName}...`}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((column) => (
                    <th key={column} className="text-left py-3 px-4 font-semibold text-gray-700 capitalize">
                      {column.replace('_', ' ')}
                    </th>
                  ))}
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    {columns.map((column) => (
              <td key={column} className="py-3 px-4">
                {column.includes('image_url') && !column.includes('gallery_images') ? ( // MODIFIED LINE: Changed condition
                  item[column] ? (
                    <img src={item[column]} alt="" className="w-12 h-12 object-cover rounded" />
                  ) : (
                    'No image'
                  )
                ) : column === 'gallery_images' ? ( // ADDED BLOCK for gallery_images
                  item[column] ? (
                    <div className="flex gap-1">
                      {item[column].split(',').filter(Boolean).slice(0, 3).map((imgUrl: string, imgIndex: number) => (
                        <img key={imgIndex} src={imgUrl.trim()} alt={`Gallery ${imgIndex}`} className="w-10 h-10 object-cover rounded" onError={(e) => e.currentTarget.src='https://via.placeholder.com/50'} />
                      ))}
                      {item[column].split(',').filter(Boolean).length > 3 && (
                        <span className="text-sm text-gray-500">+{item[column].split(',').filter(Boolean).length - 3} more</span>
                      )}
                    </div>
                  ) : (
                    'No additional images'
                  )
                ) : column === 'price' || column === 'amount' || column === 'original_price' ? ( // Moved price related checks here
                  `₹${(item[column] || 0).toLocaleString()}`
                ) : column === 'rating' ? ( // ADDED BLOCK for rating
                  item[column] ? `${item[column]}/5` : 'N/A'
                ) : column === 'inclusions' || column === 'exclusions' || column === 'itinerary' ? ( // ADDED BLOCK for text fields
                  item[column] ? String(item[column]).substring(0, 50) + (String(item[column]).length > 50 ? '...' : '') : 'N/A'
                ) : column === 'discount_percentage' && item[column] ? ( // Existing code, ensuring correct placement
                  <span className="text-green-600 font-semibold">{item[column]}% OFF</span>
                ) : column === 'category' ? ( // Existing code, ensuring correct placement
                  item[column] ? (
                    <span className="inline-block bg-orange-100 text-orange-800 text-xs font-semibold px-2 py-1 rounded-full capitalize">
                      {item[column]}
                    </span>
                  ) : 'No category'
                ) : column === 'tags' ? ( // Existing code, ensuring correct placement
                  item[column] ? (
                    <div className="flex flex-wrap gap-1">
                      {item[column].split(',').slice(0, 2).map((tag: string, index: number) => (
                        <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  ) : 'No tags'
                ) : column.includes('date') || column.includes('created_at') ? ( // Existing code, ensuring correct placement
                  new Date(item[column] || Date.now()).toLocaleDateString()
                ) : column === 'valid_until' ? ( // Existing code, ensuring correct placement
                  item[column] ? new Date(item[column]).toLocaleDateString() : 'No expiry'
                ) : column === 'payment_status' ? ( // Existing code, ensuring correct placement
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    item[column] === 'paid' ? 'bg-green-100 text-green-800' :
                    item[column] === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {item[column]}
                  </span>
                ) : (
                  String(item[column] || '').substring(0, 50) + (String(item[column] || '').length > 50 ? '...' : '')
                )}
              </td>
            ))}
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        {!['bookings', 'inquiries', 'payments'].includes(tableName) && (
                          <button
                            onClick={() => openForm(item)}
                            className="text-blue-500 hover:text-blue-700 p-1 rounded"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(tableName, item.id)}
                          className="text-red-500 hover:text-red-700 p-1 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const exportData = (data: any[], filename: string) => {
    if (data.length === 0) {
      alert('No data to export');
      return;
    }

    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderForm = () => {
    if (!showForm) return null;

    const fields = getFormFields();

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">
              {editingItem ? 'Edit' : 'Add'} {activeTab.slice(0, -1)}
            </h3>
            <button onClick={closeForm} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {fields.map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label} {field.required && '*'}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                    required={field.required}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : field.type === 'select' ? (
                  <select
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                    required={field.required}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select {field.label}</option>
                    {field.options?.map(option => (
                      <option key={option} value={option} className="capitalize">{option}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      [field.name]: field.type === 'number' ? Number(e.target.value) : e.target.value
                    }))}
                    required={field.required}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}
              </div>
            ))}

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center space-x-2 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'bookings':
        return renderBookingsTable();
      case 'qr-settings':
        return renderQrSettings();
      case 'destinations':
        return renderDataTable(
          destinations,
          ['name', 'price', 'rating', 'image_url', 'gallery_images', 'inclusions', 'exclusions', 'itinerary'], 'destinations');
      case 'services':
        return renderDataTable(services, ['name', 'description', 'image_url', 'price'], 'services');
      case 'addons':
        return <AddOnsManager />;
      case 'gallery':
        return renderDataTable(gallery, ['title', 'image_url'], 'gallery');
      case 'testimonials':
        return renderDataTable(testimonials, ['author', 'text'], 'testimonials');
      case 'advertisements':
        return renderDataTable(advertisements, ['title', 'description', 'image_url'], 'advertisements');
      case 'offers':
        return renderDataTable(offers, ['title', 'description', 'original_price', 'price', 'discount_percentage', 'valid_until', 'tags', 'image_url'], 'offers');
      case 'inquiries':
        return renderDataTable(inquiries, ['name', 'email', 'phone', 'message', 'created_at'], 'inquiries');
      case 'payments':
        return <PaymentHistory />;
      default:
        return renderDashboard();
    }
  };

  
  // Show login form if not authenticated
if (!isAuthenticated) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600">
      <div className="bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-96 animate-bounce-in">
        
        {/* Logo / Heading */}
        <div className="flex flex-col items-center mb-6">
          {/* Your Logo */}
          <img 
            src="/tripsera-logo.png"
            alt="Tripsera Logo" 
            className="w-20 h-20 object-contain mb-3"
          />
          <h2 className="text-3xl font-extrabold mt-1 text-gray-800 font-poppins">Admin Login</h2>
          <p className="text-sm text-gray-500 font-inter">Secure access to Tripsera dashboard</p>
        </div>

        {/* Error message */}
        {loginError && (
          <p className="text-red-500 text-sm mb-3 bg-red-50 px-3 py-2 rounded-lg">{loginError}</p>
        )}

        {/* Username */}
        <div className="mb-4">
          <label className="form-label font-inter">Username</label>
          <input
            type="text"
            placeholder="Enter your username"
            value={adminCredentials.username}
            onChange={(e) =>
              setAdminCredentials({ ...adminCredentials, username: e.target.value })
            }
            className="form-input"
          />
        </div>

        {/* Password */}
        <div className="mb-6">
          <label className="form-label font-inter">Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={adminCredentials.password}
            onChange={(e) =>
              setAdminCredentials({ ...adminCredentials, password: e.target.value })
            }
            className="form-input"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          onClick={handleAdminLogin}
          className="btn-primary w-full font-poppins"
        >
          Sign In
        </button>

        {/* Footer */}
        <p className="mt-4 text-center text-xs text-gray-500 font-inter">
          © {new Date().getFullYear()} Tripsera. All rights reserved.
        </p>
      </div>
    </div>
  );
}




  return (
    <div className="admin-layout">
      <div className="flex">
        {/* Sidebar */}
        <div className="admin-sidebar">
          <div className="p-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-2">
                <Shield className="w-8 h-8 text-orange-500" />
                <h1 className="text-xl font-bold text-gray-800 font-poppins">Admin Panel</h1>
              </div>
              <button
                onClick={handleLogout}
                className="text-red-500 hover:text-red-700 p-1 rounded transition-colors duration-300"
                title="Logout"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setSearchQuery('');
                      setShowForm(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 font-inter ${activeTab === tab.id
                        ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-lg'
                        : 'text-gray-600 hover:bg-gray-100 hover:scale-105'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="admin-content">
          {renderContent()}
        </div>
      </div>

      {renderForm()}

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <X className="w-8 h-8" />
            </button>
            <img
              src={selectedImage}
              alt="Payment Proof"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;