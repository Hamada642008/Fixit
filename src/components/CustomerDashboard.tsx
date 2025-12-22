import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface CustomerDashboardProps {
  profile: any;
}

export function CustomerDashboard({ profile }: CustomerDashboardProps) {
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [formData, setFormData] = useState({
    deviceType: "",
    deviceBrand: "",
    problemDescription: "",
    urgency: "medium" as "low" | "medium" | "high",
    address: "",
  });
  const [location, setLocation] = useState<{latitude: number, longitude: number} | null>(null);

  const myRequests = useQuery(api.serviceRequests.getMyRequests);
  const createRequest = useMutation(api.serviceRequests.createServiceRequest);
  const rateService = useMutation(api.serviceRequests.rateService);

  const deviceTypes = [
    { value: "smartphones", label: "هواتف ذكية" },
    { value: "laptops", label: "لابتوب" },
    { value: "desktops", label: "كمبيوتر مكتبي" },
    { value: "tablets", label: "تابلت" },
    { value: "gaming_consoles", label: "أجهزة ألعاب" },
    { value: "smart_tvs", label: "تلفزيونات ذكية" },
    { value: "home_appliances", label: "أجهزة منزلية" },
    { value: "audio_equipment", label: "أجهزة صوتية" },
    { value: "cameras", label: "كاميرات" },
  ];

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          toast.success("تم تحديد الموقع بنجاح");
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("فشل في تحديد الموقع");
        }
      );
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!location) {
      toast.error("يرجى تحديد موقعك");
      return;
    }

    try {
      await createRequest({
        deviceType: formData.deviceType,
        deviceBrand: formData.deviceBrand,
        problemDescription: formData.problemDescription,
        urgency: formData.urgency,
        customerLocation: {
          latitude: location.latitude,
          longitude: location.longitude,
          address: formData.address,
        },
      });

      toast.success("تم إرسال طلب الصيانة بنجاح!");
      setShowNewRequest(false);
      setFormData({
        deviceType: "",
        deviceBrand: "",
        problemDescription: "",
        urgency: "medium",
        address: "",
      });
      setLocation(null);
    } catch (error) {
      toast.error("فشل في إرسال الطلب");
      console.error(error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "assigned": return "bg-blue-100 text-blue-800";
      case "in_progress": return "bg-purple-100 text-purple-800";
      case "completed": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending": return "في الانتظار";
      case "assigned": return "تم التعيين";
      case "in_progress": return "قيد التنفيذ";
      case "completed": return "مكتمل";
      case "cancelled": return "ملغي";
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">مرحباً، {profile.name}</h1>
          <p className="text-gray-600">إدارة طلبات الصيانة الخاصة بك</p>
        </div>
        <button
          onClick={() => setShowNewRequest(true)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          طلب صيانة جديد
        </button>
      </div>

      {/* New Request Modal */}
      {showNewRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">طلب صيانة جديد</h2>
                <button
                  onClick={() => setShowNewRequest(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitRequest} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      نوع الجهاز
                    </label>
                    <select
                      required
                      value={formData.deviceType}
                      onChange={(e) => setFormData({...formData, deviceType: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">اختر نوع الجهاز</option>
                      {deviceTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      العلامة التجارية
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.deviceBrand}
                      onChange={(e) => setFormData({...formData, deviceBrand: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="مثل: Samsung, Apple, HP"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    وصف المشكلة
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.problemDescription}
                    onChange={(e) => setFormData({...formData, problemDescription: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="اشرح المشكلة بالتفصيل..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    مستوى الأولوية
                  </label>
                  <select
                    value={formData.urgency}
                    onChange={(e) => setFormData({...formData, urgency: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">منخفض</option>
                    <option value="medium">متوسط</option>
                    <option value="high">عالي</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    العنوان
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="العنوان التفصيلي"
                  />
                </div>

                <div>
                  <button
                    type="button"
                    onClick={getLocation}
                    className={`w-full px-4 py-2 rounded-md font-medium transition-colors ${
                      location
                        ? "bg-green-100 text-green-700 border border-green-300"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {location ? "تم تحديد الموقع ✓" : "تحديد موقعي الحالي"}
                  </button>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 transition-colors"
                  >
                    إرسال الطلب
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewRequest(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md font-medium hover:bg-gray-400 transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Requests List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">طلباتي</h2>
        </div>
        <div className="divide-y">
          {myRequests?.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              لا توجد طلبات حالياً
            </div>
          ) : (
            myRequests?.map((request) => (
              <div key={request._id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-medium text-lg">
                      {deviceTypes.find(t => t.value === request.deviceType)?.label} - {request.deviceBrand}
                    </h3>
                    <p className="text-gray-600 mt-1">{request.problemDescription}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                    {getStatusText(request.status)}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">الأولوية:</span> {
                      request.urgency === "high" ? "عالية" :
                      request.urgency === "medium" ? "متوسطة" : "منخفضة"
                    }
                  </div>
                  <div>
                    <span className="font-medium">التاريخ:</span> {new Date(request._creationTime).toLocaleDateString('ar')}
                  </div>
                  {request.estimatedCost && (
                    <div>
                      <span className="font-medium">التكلفة المقدرة:</span> {request.estimatedCost} ريال
                    </div>
                  )}
                  {request.actualCost && (
                    <div>
                      <span className="font-medium">التكلفة الفعلية:</span> {request.actualCost} ريال
                    </div>
                  )}
                </div>

                {request.status === "completed" && !request.customerRating && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">قيم الخدمة:</p>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => rateService({ requestId: request._id, rating })}
                          className="text-2xl hover:scale-110 transition-transform"
                        >
                          ⭐
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
