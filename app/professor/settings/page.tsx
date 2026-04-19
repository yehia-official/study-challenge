"use client";

export default function SettingsPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/10">
          <h2 className="text-2xl font-headline font-extrabold text-on-surface mb-2">Professor Settings</h2>
          <p className="text-on-surface-variant text-sm mb-6">Manage your account profile and institutional settings.</p>
          
          <div className="space-y-4 max-w-lg">
             <div className="flex justify-between items-center p-4 bg-surface-container rounded-xl">
                 <div>
                     <h4 className="font-bold">Notifications</h4>
                     <p className="text-xs text-on-surface-variant">Get notified when a student submits an assignment</p>
                 </div>
                 <input type="checkbox" className="w-5 h-5 accent-primary" defaultChecked />
             </div>
             <div className="flex justify-between items-center p-4 bg-surface-container rounded-xl">
                 <div>
                     <h4 className="font-bold">Dark Mode</h4>
                     <p className="text-xs text-on-surface-variant">Force dark mode across all professor screens</p>
                 </div>
                 <input type="checkbox" className="w-5 h-5 accent-primary" />
             </div>
          </div>
      </div>
    </div>
  );
}
