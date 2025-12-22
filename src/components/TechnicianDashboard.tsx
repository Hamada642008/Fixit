import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface TechnicianDashboardProps {
  profile: any;
}

export function TechnicianDashboard({ profile }: TechnicianDashboardProps) {
  const [activeTab, setActiveTab] = useState<"available" | "my_requests">("available");
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null);
  const [assignData, setAssignData] = useState({
    estimatedCost: "",
    scheduledDate: "",
  });

  const availableRequests = useQuery(api.serviceRequests.getAvailableRequests);
  const myRequests = useQuery(api.serviceRequests.getMyRequests);
  const assignTechnician = useMutation(api.serviceRequests.assignTechnician);
  const updateStatus = useMutation(api.serviceRequests.updateRequestStatus);
  const updateProfile = useMutation(api.users.updateUserProfile);

  const deviceTypes = {
    smartphones: "هواتف ذكية",
    laptops: "لابتوب",
    desktops: "كمبيوتر مكتبي",
    tablets: "تابلت",
    gaming_consoles: "أجهزة ألعاب",
    smart_tvs: "تلفزيونات ذكية",
    home_appliances: "أجهزة منزلية",
    audio_equipment: "أجهزة صوتية",
    cameras: "كاميرات",
  };

  const handleAssignRequest = async (requestId: string) => {
    try {
      await assignTechnician({
        requestId: requestId as any,
        estimatedCost: assignData.estimatedCost ? parseFloat(assignData.estimatedCost) : undefined,
        scheduledDate: assignData.scheduledDate ? new Date(assignData.scheduledDate).getTime() : undefined,
      });
      
      toast.success("تم قبول الطلب بنجاح!");
      setShowAssignModal(null);
      setAssignData({ estimatedCost: "", scheduledDate: "" });
    } catch (error) {
      toast.error("فشل في قبول الطلب");
      console.error(error);
    }
  };

  const handleStatusUpdate = async (requestId: string, status: "in_progress" | "completed" | "cancelled", actualCost?: number) => {
    try {
      await updateStatus({
        requestId: requestId as any,
        status,
        actualCost,
      });
      
      toast.success("تم تحديث حالة الطلب بنجاح!");
    } catch (error) {
      toast.error("فشل في تحديث حالة الطلب");
      console.error(error);
    }
  };

  const toggleAvailability = async () => {
    try {
      await updateProfile({
        isAvailable: !profile.isAvailable,
      });
      
      toast.success(profile.isAvailable ? "تم إيقاف التوفر" : "تم تفعيل التوفر");
    } catch (error) {
      toast.error("فشل في تحديث حالة التوفر");
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
          <p className="text-gray-600">
            التقييم: ⭐ {profile.rating?.toFixed(1) || "5.0"} | 
            الخبرة: {profile.experience} سنة
          </p>
        </div>
        <button
          onClick={toggleAvailability}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            profile.isAvailable
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-gray-600 text-white hover:bg-gray-700"
          }`}
        >
          {profile.isAvailable ? "متاح ✓" : "غير متاح"}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8 space-x-reverse">
          <button
            onClick={() => setActiveTab("available")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "available"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            الطلبات المتاحة ({availableRequests?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("my_requests")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "my_requests"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            طلباتي ({myRequests?.length || 0})
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow">
        {activeTab === "available" ? (
          <div>
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">الطلبات المتاحة</h2>
            </div>
            <div className="divide-y">
              {availableRequests?.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  لا توجد طلبات متاحة حالياً
                </div>
              ) : (
                availableRequests?.map((request) => (
                  <div key={request._id} className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-medium text-lg">
                          {deviceTypes[request.deviceType as keyof typeof deviceTypes]} - {request.deviceBrand}
                        </h3>
                        <p className="text-gray-600 mt-1">{request.problemDescription}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          📍 {request.customerLocation.address}
                        </p>
                      </div>
                      <div className="text-left">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          request.urgency === "high" ? "bg-red-100 text-red-800" :
                          request.urgency === "medium" ? "bg-yellow-100 text-yellow-800" :
                          "bg-green-100 text-green-800"
                        }`}>
                          {request.urgency === "high" ? "عالية" :
                           request.urgency === "medium" ? "متوسطة" : "منخفضة"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        {new Date(request._creationTime).toLocaleDateString('ar')}
                      </span>
                      <button
                        onClick={() => setShowAssignModal(request._id)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
                      >
                        قبول الطلب
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div>
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
                          {deviceTypes[request.deviceType as keyof typeof deviceTypes]} - {request.deviceBrand}
                        </h3>
                        <p className="text-gray-600 mt-1">{request.problemDescription}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          📍 {request.customerLocation.address}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                        {getStatusText(request.status)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
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
                      {request.customerRating && (
                        <div>
                          <span className="font-medium">التقييم:</span> ⭐ {request.customerRating}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      {request.status === "assigned" && (
                        <button
                          onClick={() => handleStatusUpdate(request._id, "in_progress")}
                          className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors"
                        >
                          بدء العمل
                        </button>
                      )}
                      {request.status === "in_progress" && (
                        <button
                          onClick={() => {
                            const cost = prompt("أدخل التكلفة الفعلية (ريال):");
                            if (cost) {
                              handleStatusUpdate(request._id, "completed", parseFloat(cost));
                            }
                          }}
                          className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                        >
                          إنهاء العمل
                        </button>
                      )}
                      {(request.status === "assigned" || request.status === "in_progress") && (
                        <button
                          onClick={() => handleStatusUpdate(request._id, "cancelled")}
                          className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                        >
                          إلغاء
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">قبول الطلب</h2>
                <button
                  onClick={() => setShowAssignModal(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    التكلفة المقدرة (ريال) - اختياري
                  </label>
                  <input
                    type="number"
                    value={assignData.estimatedCost}
                    onChange={(e) => setAssignData({...assignData, estimatedCost: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    موعد الزيارة المقترح - اختياري
                  </label>
                  <input
                    type="datetime-local"
                    value={assignData.scheduledDate}
                    onChange={(e) => setAssignData({...assignData, scheduledDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => handleAssignRequest(showAssignModal)}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 transition-colors"
                  >
                    قبول الطلب
                  </button>
                  <button
                    onClick={() => setShowAssignModal(null)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md font-medium hover:bg-gray-400 transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
