import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, MapPin, CreditCard, Upload, Download, Eye, Check, X, Gift, Home, Image } from 'lucide-react';
import { useSupabaseQuery, useSupabaseMutation } from '../../hooks/useSupabase';
import PaymentProcessor from './PaymentProcessor';
import TicketGenerator from './TicketGenerator';
import AddOnsSelector from './AddOnsSelector';
import ImageUploader from '../common/ImageUploader';
import LoadingSpinner from '../common/LoadingSpinner';

interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
  is_active: boolean;
  max_quantity: number;
}

interface SelectedAddOn {
  addon: AddOn;
  quantity: number;
  totalPrice: number;
}

interface BookingData {
  id?: string;
  customer_name: string;
  email: string;
  mobile: string;
  address: string;
  destination_id: string;
  service_id: string;
  booking_date: string;
  details: string;
  seats_selected: number;
  total_amount: number;
  addons_total: number;
  base_amount: number;
  payment_status: 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled';
  payment_method?: string;
  transaction_id?: string;
  customer_image_url?: string;
  payment_proof_url?: string;
}

interface BookingInterfaceProps {
  preSelectedDestination?: string;
  preSelectedService?: string;
}

const BookingInterface: React.FC<BookingInterfaceProps> = ({
  preSelectedDestination,
  preSelectedService
}) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState<BookingData>({
    customer_name: '',
    email: '',
    mobile: '',
    address: '',
    destination_id: '',
    service_id: '',
    booking_date: '',
    details: '',
    seats_selected: 1,
    total_amount: 0,
    addons_total: 0,
    base_amount: 0,
    payment_status: 'pending'
  });
  const [selectedAddOns, setSelectedAddOns] = useState<SelectedAddOn[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPayment, setShowPayment] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  const { data: destinations } = useSupabaseQuery('destinations', '*');
  const { data: services } = useSupabaseQuery('services', '*');
  const { insert, update, loading } = useSupabaseMutation();

  // Set pre-selected values
  useEffect(() => {
    if (preSelectedDestination) {
      const destination = destinations.find(d => d.name === preSelectedDestination);
      if (destination) {
        setBookingData(prev => ({ ...prev, destination_id: destination.id }));
      }
    }
    if (preSelectedService) {
      const service = services.find(s => s.name === preSelectedService);
      if (service) {
        setBookingData(prev => ({ ...prev, service_id: service.id }));
      }
    }
  }, [preSelectedDestination, preSelectedService, destinations, services]);

  // Calculate total amount
  useEffect(() => {
    const destination = destinations.find(d => d.id === bookingData.destination_id);
    const service = services.find(s => s.id === bookingData.service_id);
    
    // Ensure prices are numbers, not strings
    const destPrice = parseFloat(destination?.price) || 0;
    const servicePrice = parseFloat(service?.price) || 0;
    
    const baseTotal = (destPrice + servicePrice) * bookingData.seats_selected;
    const addonsTotal = selectedAddOns.reduce((sum, item) => sum + (parseFloat(item.totalPrice) || 0), 0);
    const grandTotal = baseTotal + addonsTotal;
    
    
    setBookingData(prev => ({ 
      ...prev, 
      total_amount: grandTotal, // This should be the grand total
      addons_total: addonsTotal,
      base_amount: baseTotal // Store base amount separately
    }));
  }, [bookingData.destination_id, bookingData.service_id, bookingData.seats_selected, selectedAddOns, destinations, services]);

  const handleAddOnsChange = (addons: SelectedAddOn[], totalPrice: number) => {
    setSelectedAddOns(addons);
  };

  const handleBookingComplete = () => {
    // Show success message and redirect after a short delay
    setTimeout(() => {
      // Randomly choose between home and gallery page
      const redirectTo = Math.random() < 0.5 ? '/' : '/gallery';
      navigate(redirectTo);
    }, 2000); // 2 second delay to show success message
  };

  const handleRedirectToHome = () => {
    navigate('/');
  };

  const handleRedirectToGallery = () => {
    navigate('/gallery');
  };

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!bookingData.customer_name || bookingData.customer_name.length < 2) {
        newErrors.customer_name = 'Name must be at least 2 characters';
      }
      if (!bookingData.email || !/\S+@\S+\.\S+/.test(bookingData.email)) {
        newErrors.email = 'Invalid email address';
      }
      if (!bookingData.mobile || bookingData.mobile.length < 10) {
        newErrors.mobile = 'Mobile number must be at least 10 digits';
      }
      if (!bookingData.address || bookingData.address.length < 10) {
        newErrors.address = 'Address must be at least 10 characters';
      }
    }

    if (step === 2) {
      if (!bookingData.destination_id) {
        newErrors.destination_id = 'Please select a destination';
      }
      if (!bookingData.service_id) {
        newErrors.service_id = 'Please select a service';
      }
      if (!bookingData.booking_date) {
        newErrors.booking_date = 'Please select a date';
      }
      if (bookingData.seats_selected < 1) {
        newErrors.seats_selected = 'At least 1 seat must be selected';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleBookingSubmit = async () => {
    if (!validateStep(2)) return;

    try {
      const result = await insert('bookings', bookingData);
      setBookingData(prev => ({ ...prev, id: result.id }));
      setShowPayment(true);
    } catch (error) {
      console.error('Booking submission error:', error);
      alert('Failed to submit booking. Please try again.');
    }
  };

  const handlePaymentSuccess = async (paymentData: any) => {
    try {
      // Only proceed if payment is actually validated
      if (!paymentData.paymentValidated) {
        alert('Payment validation failed. Please try again.');
        return;
      }
      
      await update('bookings', bookingData.id!, {
        payment_status: 'paid',
        payment_method: paymentData.method,
        transaction_id: paymentData.transactionId,
        payment_proof_url: paymentData.paymentProof,
        total_amount: bookingData.total_amount,
        seats_selected: bookingData.seats_selected,
        customer_name: bookingData.customer_name,
        email: bookingData.email,
        mobile: bookingData.mobile,
        address: bookingData.address,
        destination_id: bookingData.destination_id,
        service_id: bookingData.service_id,
        booking_date: bookingData.booking_date,
        details: bookingData.details
      });
      
      setBookingData(prev => ({ 
        ...prev, 
        payment_status: 'paid',
        payment_method: paymentData.method,
        transaction_id: paymentData.transactionId,
        total_amount: bookingData.total_amount,
        seats_selected: bookingData.seats_selected
      }));
      
      setShowPayment(false);
      setBookingConfirmed(true);
      
      // Only show ticket if payment is confirmed as paid
      if (paymentData.paymentValidated) {
        setShowTicket(true);
      }
      
      // Send confirmation email (mock)
      console.log('Sending confirmation email to:', bookingData.email);
    } catch (error) {
      console.error('Payment update error:', error);
      alert('Failed to process payment. Please contact support.');
    }
  };

  const getDestinationName = (id: string) => {
    return destinations.find(d => d.id === id)?.name || 'Unknown';
  };

  const getServiceName = (id: string) => {
    return services.find(s => s.id === id)?.name || 'Unknown';
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
            currentStep >= step ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            {bookingConfirmed && step === 4 ? <Check className="w-5 h-5" /> : step}
          </div>
          {step < 4 && (
            <div className={`w-16 h-1 mx-2 ${
              currentStep > step ? 'bg-orange-500' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderPersonalInfo = () => (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">Personal Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            value={bookingData.customer_name}
            onChange={(e) => setBookingData(prev => ({ ...prev, customer_name: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Enter your full name"
          />
          {errors.customer_name && (
            <p className="text-red-500 text-sm mt-1">{errors.customer_name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            value={bookingData.email}
            onChange={(e) => setBookingData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Enter your email"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mobile Number *
          </label>
          <input
            type="tel"
            value={bookingData.mobile}
            onChange={(e) => setBookingData(prev => ({ ...prev, mobile: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="+91 1234567890"
          />
          {errors.mobile && (
            <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profile Photo (Optional)
          </label>
          <ImageUploader
            onImageUpload={(imageUrl) => setBookingData(prev => ({ ...prev, customer_image_url: imageUrl }))}
            maxSize={20}
            className="w-full"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Address *
        </label>
        <textarea
          value={bookingData.address}
          onChange={(e) => setBookingData(prev => ({ ...prev, address: e.target.value }))}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          placeholder="Enter your complete address"
        />
        {errors.address && (
          <p className="text-red-500 text-sm mt-1">{errors.address}</p>
        )}
      </div>
    </div>
  );

  const renderAddOnsStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-2 font-poppins">Enhance Your Trip</h3>
        <p className="text-gray-600 font-inter">Add extra services and experiences to make your journey unforgettable</p>
      </div>
      
      <AddOnsSelector
        onAddOnsChange={handleAddOnsChange}
        selectedDestination={getDestinationName(bookingData.destination_id)}
      />
      
      {selectedAddOns.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-6 border border-orange-200">
          <h4 className="text-lg font-bold text-gray-800 mb-4 font-poppins">Selected Add-ons Summary</h4>
          <div className="space-y-2">
            {selectedAddOns.map(item => (
              <div key={item.addon.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">🎁</span>
                  <div>
                    <div className="font-semibold text-gray-800 font-inter">{item.addon.name}</div>
                    <div className="text-sm text-gray-500 font-inter">
                      {item.quantity} × ₹{item.addon.price.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="font-bold text-orange-500 font-poppins">
                  ₹{item.totalPrice.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-orange-200 mt-4 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-800 font-inter">Total Add-ons:</span>
              <span className="text-2xl font-bold text-orange-500 font-poppins">
                ₹{bookingData.addons_total.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderBookingDetails = () => (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">Booking Details</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Destination *
          </label>
          <select
            value={bookingData.destination_id}
            onChange={(e) => setBookingData(prev => ({ ...prev, destination_id: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">Select Destination</option>
            {destinations.map((dest) => (
              <option key={dest.id} value={dest.id}>
                {dest.name} (₹{dest.price.toLocaleString()})
              </option>
            ))}
          </select>
          {errors.destination_id && (
            <p className="text-red-500 text-sm mt-1">{errors.destination_id}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Service *
          </label>
          <select
            value={bookingData.service_id}
            onChange={(e) => setBookingData(prev => ({ ...prev, service_id: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">Select Service</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} (₹{service.price.toLocaleString()})
              </option>
            ))}
          </select>
          {errors.service_id && (
            <p className="text-red-500 text-sm mt-1">{errors.service_id}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Travel Date *
          </label>
          <input
            type="date"
            value={bookingData.booking_date}
            onChange={(e) => setBookingData(prev => ({ ...prev, booking_date: e.target.value }))}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          {errors.booking_date && (
            <p className="text-red-500 text-sm mt-1">{errors.booking_date}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Travelers *
          </label>
          <select
            value={bookingData.seats_selected}
            onChange={(e) => setBookingData(prev => ({ ...prev, seats_selected: parseInt(e.target.value) }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            {[1,2,3,4,5,6,7,8,9,10].map(num => (
              <option key={num} value={num}>{num} {num === 1 ? 'Person' : 'People'}</option>
            ))}
          </select>
          {errors.seats_selected && (
            <p className="text-red-500 text-sm mt-1">{errors.seats_selected}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Special Requests
        </label>
        <textarea
          value={bookingData.details}
          onChange={(e) => setBookingData(prev => ({ ...prev, details: e.target.value }))}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          placeholder="Any special requests or additional information..."
        />
      </div>
    </div>
  );

  const renderBookingSummary = () => (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">Booking Summary</h3>
      
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-gray-700">Customer Details</h4>
            <p className="text-gray-600">{bookingData.customer_name}</p>
            <p className="text-gray-600">{bookingData.email}</p>
            <p className="text-gray-600">{bookingData.mobile}</p>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-700">Travel Details</h4>
            <p className="text-gray-600">
              <MapPin className="w-4 h-4 inline mr-1" />
              {getDestinationName(bookingData.destination_id)}
            </p>
            <p className="text-gray-600">
              <Calendar className="w-4 h-4 inline mr-1" />
              {bookingData.booking_date}
            </p>
            <p className="text-gray-600">
              <Users className="w-4 h-4 inline mr-1" />
              {bookingData.seats_selected} {bookingData.seats_selected === 1 ? 'Person' : 'People'}
            </p>
          </div>
        </div>
        
        <div className="border-t pt-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span>Base Package:</span>
              <span className="text-gray-600">₹{bookingData.base_amount.toLocaleString()}</span>
            </div>
            {selectedAddOns.length > 0 && (
              <>
                <div className="flex justify-between items-center">
                  <span>Add-ons:</span>
                  <span className="text-gray-600">₹{bookingData.addons_total.toLocaleString()}</span>
                </div>
                {selectedAddOns.map(item => (
                  <div key={item.addon.id} className="flex justify-between items-center text-sm text-gray-500 ml-4">
                    <span>• {item.addon.name} ({item.quantity}×)</span>
                    <span>₹{item.totalPrice.toLocaleString()}</span>
                  </div>
                ))}
              </>
            )}
            <div className="border-t pt-2">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total Amount:</span>
                <span className="text-teal-600">₹{bookingData.total_amount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (showTicket && bookingConfirmed) {
    return (
      <TicketGenerator
        bookingData={bookingData}
        destinationName={getDestinationName(bookingData.destination_id)}
        serviceName={getServiceName(bookingData.service_id)}
        selectedAddOns={selectedAddOns}
        onClose={handleBookingComplete}
        onNavigateToHome={handleRedirectToHome}
        onNavigateToGallery={handleRedirectToGallery}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Secure Booking System</h1>
            <p className="text-xl text-gray-600">Complete your travel booking in 3 easy steps</p>
          </div>

          {renderStepIndicator()}

          <div className="bg-white rounded-2xl shadow-xl p-8">
            {currentStep === 1 && renderPersonalInfo()}
            {currentStep === 2 && renderBookingDetails()}
            {currentStep === 3 && renderAddOnsStep()}
            {currentStep === 4 && renderBookingSummary()}

            <div className="flex justify-between mt-8">
              {currentStep > 1 && (
                <button
                  onClick={handlePrevious}
                  className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Previous
                </button>
              )}
              
              <div className="ml-auto">
                {currentStep < 4 ? (
                  <button
                    onClick={handleNext}
                    className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleBookingSubmit}
                    disabled={loading}
                    className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    {loading ? <LoadingSpinner size="sm" /> : <CreditCard className="w-5 h-5" />}
                    <span>Proceed to Payment</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPayment && (
        <PaymentProcessor
          bookingData={bookingData}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowPayment(false)}
        />
      )}
    </div>
  );
};

export default BookingInterface;