import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { ProfileSetup } from "./components/ProfileSetup";
import { Dashboard } from "./components/Dashboard";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">F</span>
          </div>
          <h2 className="text-xl font-bold text-blue-600">Fixit</h2>
        </div>
        <Authenticated>
          <SignOutButton />
        </Authenticated>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-6xl mx-auto">
          <Content />
        </div>
      </main>
      <Toaster />
    </div>
  );
}

function Content() {
  const userProfile = useQuery(api.users.getCurrentUserProfile);

  if (userProfile === undefined) {
    return (
      <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <Unauthenticated>
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-blue-600 mb-4">Fixit</h1>
          <p className="text-xl text-gray-600 mb-2">
            اربط مع أقرب فني لصيانة أجهزتك الإلكترونية
          </p>
          <p className="text-lg text-gray-500">
            Connect with the nearest technician for your electronics repair
          </p>
        </div>
        <div className="max-w-md mx-auto">
          <SignInForm />
        </div>
      </Unauthenticated>

      <Authenticated>
        {!userProfile?.profile ? (
          <ProfileSetup />
        ) : (
          <Dashboard userProfile={userProfile} />
        )}
      </Authenticated>
    </div>
  );
}
