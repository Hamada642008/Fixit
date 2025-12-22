import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function ProfileSetup() {
  const [role, setRole] = useState<"customer" | "technician" | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    specializations: [] as string[],
    experience: 0,
  });
  const [location, setLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const createProfile = useMutation(api.users.createUserProfile);

  const deviceTypes = [
    "smartphones", "laptops", "desktops", "tablets", "gaming_consoles", 
    "smart_tvs", "home_appliances", "audio_equipment", "cameras", "all"
  ];

  const getLocation = () => {
    setIsGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setIsGettingLocation(false);
          toast.success("تم الحصول على الموقع بنجاح");
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("فشل في الحصول على الموقع");
          setIsGettingLocation(false);
        }
      );
    } else {
      toast.error("المتصفح لا يدعم تحديد الموقع");
      setIsGettingLocation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!role) {
      toast.error("يرجى اختيار نوع الحساب");
      return;
    }

    if (role === "technician" && !location) {
      toast.error("يرجى تحديد موقعك الجغرافي");
      return;
    }

    try {
      await createProfile({
        role,
        name: formData.name,
        phone: formData.phone,
        address: formData.address || undefined,
        specializations: role === "technician" ? formData.specializations : undefined,
        experience: role === "technician" ? formData.experience : undefined,
        latitude: location?.latitude,
        longitude: location?.longitude,
      });
      
      toast.success("تم إنشاء الملف الشخصي بنجاح!");
    } catch (error) {
      toast.error("فشل في إنشاء الملف الشخصي");
      console.error(error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
        إعداد الملف الشخصي
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            نوع الحساب
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setRole("customer")}
              className={`p-4 border-2 rounded-lg text-center transition-colors ${
                role === "customer"
                  ? "border-blue-600 bg-blue-50 text-blue-600"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="text-2xl mb-2">👤</div>
              <div className="font-medium">عميل</div>
              <div className="text-sm text-gray-500">أحتاج إصلاح جهاز</div>
            </button>
            <button
              type="button"
              onClick={() => setRole("technician")}
              className={`p-4 border-2 rounded-lg text-center transition-colors ${
                role === "technician"
                  ? "border-blue-600 bg-blue-50 text-blue-600"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="text-2xl mb-2">🔧</div>
              <div className="font-medium">فني</div>
              <div className="text-sm text-gray-500">أقدم خدمات الإصلاح</div>
            </button>
          </div>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الاسم الكامل
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="أدخل اسمك الكامل"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              رقم الهاتف
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="05xxxxxxxx"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            العنوان
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="المدينة، الحي"
          />
        </div>

        {/* Technician-specific fields */}
        {role === "technician" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                التخصصات
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {deviceTypes.map((type) => (
                  <label key={type} className="flex items-center space-x-2 space-x-reverse">
                    <input
                      type="checkbox"
                      checked={formData.specializations.includes(type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            specializations: [...formData.specializations, type]
                          });
                        } else {
                          setFormData({
                            ...formData,
                            specializations: formData.specializations.filter(s => s !== type)
                          });
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">
                      {type === "smartphones" && "هواتف ذكية"}
                      {type === "laptops" && "لابتوب"}
                      {type === "desktops" && "كمبيوتر مكتبي"}
                      {type === "tablets" && "تابلت"}
                      {type === "gaming_consoles" && "أجهزة ألعاب"}
                      {type === "smart_tvs" && "تلفزيونات ذكية"}
                      {type === "home_appliances" && "أجهزة منزلية"}
                      {type === "audio_equipment" && "أجهزة صوتية"}
                      {type === "cameras" && "كاميرات"}
                      {type === "all" && "جميع الأجهزة"}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                سنوات الخبرة
              </label>
              <input
                type="number"
                min="0"
                value={formData.experience}
                onChange={(e) => setFormData({...formData, experience: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الموقع الجغرافي
              </label>
              <button
                type="button"
                onClick={getLocation}
                disabled={isGettingLocation}
                className={`w-full px-4 py-2 rounded-md font-medium transition-colors ${
                  location
                    ? "bg-green-100 text-green-700 border border-green-300"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                } ${isGettingLocation ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isGettingLocation ? "جاري تحديد الموقع..." : 
                 location ? "تم تحديد الموقع ✓" : "تحديد موقعي الحالي"}
              </button>
            </div>
          </>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 transition-colors"
        >
          إنشاء الملف الشخصي
        </button>
      </form>
    </div>
  );
}
