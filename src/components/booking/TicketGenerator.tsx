import React, { useRef } from 'react';
import { Download, Printer, QrCode, Calendar, MapPin, Users, Phone, Mail, X, Home, Image } from 'lucide-react';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

interface TicketGeneratorProps {
  bookingData: any;
  destinationName: string;
  serviceName: string;
  selectedAddOns?: SelectedAddOn[];
  onClose: () => void;
  onNavigateToHome?: () => void;
  onNavigateToGallery?: () => void;
}

const TicketGenerator: React.FC<TicketGeneratorProps> = ({
  bookingData,
  destinationName,
  serviceName,
  selectedAddOns = [],
  onClose,
  onNavigateToHome,
  onNavigateToGallery
}) => {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [qrCodeUrl, setQrCodeUrl] = React.useState<string>('');

  React.useEffect(() => {
    generateQRCode();
  }, []);

  const generateQRCode = async () => {
    try {
      const qrData = JSON.stringify({
        bookingId: bookingData.id,
        customerName: bookingData.customer_name,
        destination: destinationName,
        date: bookingData.booking_date,
        amount: bookingData.total_amount,
        status: 'confirmed'
      });
      
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      setQrCodeUrl(qrCodeDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const downloadPDF = async () => {
    if (!ticketRef.current) return;

    try {
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`ticket-${bookingData.id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const printTicket = () => {
    if (!ticketRef.current) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Travel Ticket - ${bookingData.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .ticket { max-width: 800px; margin: 0 auto; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="ticket">
            ${ticketRef.current.innerHTML}
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">Your Travel Ticket</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modern Airline-Style Ticket */}
        <div ref={ticketRef} className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-6 border-4 border-gray-100">
          {/* Ticket Header */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full -ml-8 -mb-8"></div>
            
            <div className="flex justify-between items-start relative z-10">
              <div>
                <h1 className="text-4xl font-bold mb-2 tracking-wide">ChandanPrasad Travels</h1>
                <p className="text-indigo-100 text-lg">Your Premium Travel Experience</p>
              </div>
              <div className="text-right">
                <p className="text-indigo-100 text-sm">Booking Reference</p>
                <p className="text-2xl font-bold tracking-wider">{bookingData.id}</p>
              </div>
            </div>
          </div>

          {/* Ticket Body */}
          <div className="p-8">
            {/* Trip Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Left Column */}
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <MapPin className="w-6 h-6 text-blue-600 mr-2" />
                    Journey Details
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-blue-100">
                      <span className="text-gray-600 font-medium">Destination</span>
                      <span className="text-lg font-bold text-gray-800">{destinationName}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-blue-100">
                      <span className="text-gray-600 font-medium">Travel Date</span>
                      <span className="text-lg font-bold text-gray-800">{new Date(bookingData.booking_date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-blue-100">
                      <span className="text-gray-600 font-medium">Travelers</span>
                      <span className="text-lg font-bold text-gray-800">{bookingData.seats_selected} {bookingData.seats_selected === 1 ? 'Person' : 'People'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 font-medium">Service</span>
                      <span className="text-lg font-bold text-gray-800">{serviceName}</span>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <Users className="w-6 h-6 text-green-600 mr-2" />
                    Passenger Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-2xl font-bold text-gray-800">{bookingData.customer_name}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{bookingData.email}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{bookingData.mobile}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Add-ons Section */}
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-6 border border-orange-100">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <span className="text-2xl mr-2">🎁</span>
                    Selected Add-ons
                  </h3>
                  <div className="space-y-3">
                    {selectedAddOns.length > 0 ? (
                      <>
                        {selectedAddOns.map((item, index) => (
                          <div key={item.addon.id} className="bg-white rounded-lg p-4 border border-orange-200">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-bold text-gray-800">{item.addon.name}</p>
                                <p className="text-sm text-gray-600">{item.addon.description}</p>
                                <p className="text-sm text-orange-600 font-medium">Quantity: {item.quantity}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-gray-800">₹{item.totalPrice.toLocaleString()}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                        <div className="border-t border-orange-200 pt-3">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-gray-800">Add-ons Total:</span>
                            <span className="text-xl font-bold text-orange-600">₹{bookingData.addons_total?.toLocaleString() || '0'}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="bg-white rounded-lg p-4 border border-orange-200 text-center">
                        <p className="text-gray-500">No add-ons selected</p>
                        <p className="text-sm text-gray-400 mt-1">You can add extra services during booking</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Information */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <span className="text-2xl mr-2">💳</span>
                    Payment Summary
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-purple-100">
                      <span className="text-gray-600">Base Package</span>
                      <span className="font-bold text-gray-800">₹{bookingData.base_amount?.toLocaleString() || '0'}</span>
                    </div>
                    {selectedAddOns.length > 0 && (
                      <div className="flex justify-between items-center py-2 border-b border-purple-100">
                        <span className="text-gray-600">Add-ons</span>
                        <span className="font-bold text-gray-800">₹{bookingData.addons_total?.toLocaleString() || '0'}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-3 bg-purple-100 rounded-lg px-4">
                      <span className="text-lg font-bold text-gray-800">Total Amount</span>
                      <span className="text-2xl font-bold text-purple-600">₹{bookingData.total_amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Payment Status</span>
                      <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                        bookingData.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                        bookingData.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {bookingData.payment_status?.toUpperCase() || 'PENDING'}
                      </span>
                    </div>
                    {bookingData.transaction_id && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Transaction ID</p>
                        <p className="font-mono text-sm text-gray-800">{bookingData.transaction_id}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* QR Code */}
                <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl p-6 border border-gray-100 text-center">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Digital Verification</h3>
                  <div className="bg-white rounded-lg p-4 inline-block">
                    {qrCodeUrl && (
                      <img src={qrCodeUrl} alt="QR Code" className="w-32 h-32" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-3">
                    Scan for booking verification
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl p-6 border border-gray-100">
              <div className="text-center">
                <p className="text-gray-600 mb-2">Thank you for choosing ChandanPrasad Travels!</p>
                <p className="text-sm text-gray-500">Have a wonderful journey and create beautiful memories.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={downloadPDF}
            className="flex items-center space-x-2 bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
          >
            <Download className="w-5 h-5" />
            <span>Download PDF</span>
          </button>
          
          <button
            onClick={printTicket}
            className="flex items-center space-x-2 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Printer className="w-5 h-5" />
            <span>Print Ticket</span>
          </button>
          
          {onNavigateToHome && (
            <button
              onClick={onNavigateToHome}
              className="flex items-center space-x-2 bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
            >
              <Home className="w-5 h-5" />
              <span>Go to Home</span>
            </button>
          )}
          
          {onNavigateToGallery && (
            <button
              onClick={onNavigateToGallery}
              className="flex items-center space-x-2 bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition-colors"
            >
              <Image className="w-5 h-5" />
              <span>View Gallery</span>
            </button>
          )}
          
          <button
            onClick={onClose}
            className="flex items-center space-x-2 bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
          >
            <span>Close</span>
          </button>
        </div>

        {/* Important Notes */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 mb-2">Important Notes:</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Please carry a valid ID proof during travel</li>
            <li>• Arrive at the pickup point 30 minutes before departure</li>
            <li>• This ticket is non-transferable and non-refundable</li>
            <li>• Keep this ticket safe and present it when required</li>
            <li>• For any queries, contact us at +91 8296724981</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TicketGenerator;