import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  MapPin, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  History, 
  Plus, 
  ChevronRight, 
  Info,
  ShieldAlert,
  PhoneCall,
  Navigation,
  LogOut,
  User,
  Car,
  ArrowLeft,
  Settings,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeParkingImage, ParkingAnalysis } from './services/geminiService';

type Step = 'SPLASH' | 'ONBOARDING' | 'AUTH' | 'HOME' | 'CAPTURE' | 'ANALYZING' | 'RESULT' | 'PROFILE' | 'ADD_VEHICLE';

interface Report {
  id: string;
  timestamp: string;
  location: string;
  verdict: string;
  score: number;
  image: string;
}

interface Vehicle {
  id: string;
  plate: string;
  model: string;
  color: string;
}

export default function App() {
  const [step, setStep] = useState<Step>('SPLASH');
  const [onboardingIndex, setOnboardingIndex] = useState(0);
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState<{username: string} | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<ParkingAnalysis | null>(null);
  const [history, setHistory] = useState<Report[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    { id: '1', plate: 'HR 26 DQ 1234', model: 'Swift', color: 'White' }
  ]);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  }, []);

  useEffect(() => {
    if (step === 'SPLASH') {
      const timer = setTimeout(() => setStep('ONBOARDING'), 2500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const onboardingData = [
    {
      title: "Snap & Report",
      description: "Spotted a wrongly parked vehicle? Capture 4 photos and let our AI do the heavy lifting.",
      icon: <Camera size={64} className="text-orange-500" />,
      color: "bg-orange-100"
    },
    {
      title: "Smart AI & Geo-Rules",
      description: "Instantly detects footpaths, zebra crossings, and no-parking zones using advanced vision and GPS.",
      icon: <MapPin size={64} className="text-emerald-500" />,
      color: "bg-emerald-100"
    },
    {
      title: "Take Action & SOS",
      description: "Send alerts, call vehicle owners anonymously, or trigger SOS for severe obstructions.",
      icon: <ShieldAlert size={64} className="text-blue-500" />,
      color: "bg-blue-100"
    }
  ];

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setUser({ username: 'admin' });
    setStep('HOME');
  };

  const handleLogout = () => {
    setUser(null);
    setStep('AUTH');
  };

  const startCapture = async () => {
    setStep('CAPTURE');
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Camera access denied. Please enable permissions.");
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setPhotos(prev => [...prev, dataUrl]);
        
        if (photos.length + 1 >= 4) {
          stopCapture();
          runAnalysis(dataUrl);
        }
      }
    }
  };

  const stopCapture = () => {
    setIsCapturing(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const runAnalysis = async (lastPhoto: string) => {
    setStep('ANALYZING');
    try {
      const result = await analyzeParkingImage(lastPhoto);
      const geoResponse = await fetch('/api/geo-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(location || { lat: 0, lng: 0 })
      });
      const geoData = await geoResponse.json();
      
      const finalScore = Math.min(100, result.score + geoData.geo_score_boost);
      let finalVerdict = result.verdict;
      if (finalScore >= 60) finalVerdict = "WRONG_PARKING";
      else if (finalScore >= 30) finalVerdict = "SUSPICIOUS";

      const finalResult = {
        ...result,
        score: finalScore,
        verdict: finalVerdict as any,
        reason_codes: [
          ...result.reason_codes,
          ...(geoData.near_junction ? ["NEAR_JUNCTION"] : []),
          ...(geoData.near_hospital ? ["NEAR_HOSPITAL"] : [])
        ]
      };

      setAnalysis(finalResult);
      setHistory(prev => [{
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        location: location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : "Unknown",
        verdict: finalVerdict,
        score: finalScore,
        image: lastPhoto
      }, ...prev]);
      
      setStep('RESULT');
    } catch (err) {
      console.error("Analysis failed:", err);
      setStep('HOME');
      alert("Analysis failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto bg-slate-50 text-slate-900 relative overflow-hidden flex flex-col font-sans shadow-2xl sm:rounded-3xl sm:h-[90vh] sm:my-8 sm:border border-slate-200">
      <AnimatePresence mode="wait">
        {step === 'SPLASH' && (
          <motion.div 
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center bg-orange-500 text-white absolute inset-0 z-50"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-2xl mb-6"
            >
              <ShieldCheck size={48} className="text-orange-500" />
            </motion.div>
            <h1 className="text-4xl font-extrabold tracking-tight">ParkingMudde</h1>
            <p className="text-orange-100 mt-2 font-medium tracking-wide">AI Violation Detection</p>
          </motion.div>
        )}

        {step === 'ONBOARDING' && (
          <motion.div 
            key="onboarding"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col bg-white absolute inset-0 z-50"
          >
            <div className="flex justify-end p-6">
              <button onClick={() => setStep('AUTH')} className="text-sm font-bold text-slate-400 hover:text-slate-900">
                Skip
              </button>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={onboardingIndex}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.2 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                  className={`w-40 h-40 ${onboardingData[onboardingIndex].color} rounded-full flex items-center justify-center mb-12 shadow-xl`}
                >
                  {onboardingData[onboardingIndex].icon}
                </motion.div>
              </AnimatePresence>
              
              <h2 className="text-3xl font-extrabold text-slate-900 mb-4">
                {onboardingData[onboardingIndex].title}
              </h2>
              <p className="text-slate-500 font-medium leading-relaxed">
                {onboardingData[onboardingIndex].description}
              </p>
            </div>

            <div className="p-8 pb-12 flex flex-col items-center">
              <div className="flex gap-2 mb-8">
                {onboardingData.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-2 rounded-full transition-all duration-300 ${i === onboardingIndex ? 'w-8 bg-orange-500' : 'w-2 bg-slate-200'}`}
                  />
                ))}
              </div>
              
              <button 
                onClick={() => {
                  if (onboardingIndex < onboardingData.length - 1) {
                    setOnboardingIndex(prev => prev + 1);
                  } else {
                    setStep('AUTH');
                  }
                }}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all"
              >
                {onboardingIndex < onboardingData.length - 1 ? 'Next' : 'Get Started'}
              </button>
            </div>
          </motion.div>
        )}

        {step === 'AUTH' && (
          <motion.div 
            key="auth"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col p-8 justify-center bg-white"
          >
            <div className="mb-12 text-center">
              <div className="w-20 h-20 bg-orange-500 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-orange-500/30">
                <ShieldCheck size={40} className="text-white" />
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">ParkingMudde</h1>
              <p className="text-sm text-slate-500 mt-2 font-medium">Smart Violation Detection</p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Username</label>
                <input 
                  type="text" 
                  required 
                  placeholder="admin"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Password</label>
                <input 
                  type="password" 
                  required 
                  placeholder="••••••••"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-semibold shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all mt-4"
              >
                {isLogin ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="mt-8 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors text-center"
            >
              {isLogin ? "Don't have an account? Register" : "Already have an account? Sign In"}
            </button>
          </motion.div>
        )}

        {step !== 'AUTH' && step !== 'SPLASH' && step !== 'ONBOARDING' && (
          <>
            <header className="px-6 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-10 flex justify-between items-center border-b border-slate-100">
              <div className="flex items-center gap-3">
                {step !== 'HOME' && (
                  <button onClick={() => setStep('HOME')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ArrowLeft size={20} className="text-slate-700" />
                  </button>
                )}
                <div>
                  <h1 className="text-lg font-bold tracking-tight text-slate-900">
                    {step === 'PROFILE' ? 'Profile' : step === 'ADD_VEHICLE' ? 'Add Vehicle' : 'ParkingMudde'}
                  </h1>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep('PROFILE')} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                  <User size={18} className="text-slate-700" />
                </button>
              </div>
            </header>

            <main className="flex-1 overflow-y-auto pb-24">
              <AnimatePresence mode="wait">
                {step === 'HOME' && (
                  <motion.div 
                    key="home"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-6 space-y-8"
                  >
                    {/* Modern Stats Card */}
                    <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl shadow-slate-900/20 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-6 opacity-10">
                        <ShieldCheck size={120} />
                      </div>
                      <div className="relative z-10">
                        <p className="text-sm font-medium text-slate-400 mb-1">Reports Today</p>
                        <h2 className="text-5xl font-extrabold tracking-tight mb-8">0{history.length}</h2>
                        
                        <button 
                          onClick={startCapture}
                          className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/30"
                        >
                          <Camera size={20} />
                          Report Violation
                        </button>
                      </div>
                    </div>

                    {/* History List */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center px-1">
                        <h3 className="text-sm font-bold text-slate-800">Recent Activity</h3>
                        <button className="text-xs font-semibold text-orange-500 hover:text-orange-600">View All</button>
                      </div>
                      
                      {history.length === 0 ? (
                        <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center shadow-sm">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <History size={24} className="text-slate-300" />
                          </div>
                          <p className="text-sm font-medium text-slate-500">No reports filed yet</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {history.map(report => (
                            <div key={report.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                report.verdict === 'WRONG_PARKING' ? 'bg-red-100 text-red-600' : 
                                report.verdict === 'SUSPICIOUS' ? 'bg-orange-100 text-orange-600' : 
                                'bg-emerald-100 text-emerald-600'
                              }`}>
                                {report.verdict === 'WRONG_PARKING' ? <XCircle size={24} /> : 
                                 report.verdict === 'SUSPICIOUS' ? <AlertTriangle size={24} /> : 
                                 <CheckCircle size={24} />}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-bold text-slate-900 text-sm">{report.verdict.replace('_', ' ')}</h4>
                                <p className="text-xs text-slate-500 font-medium">{report.timestamp} • {report.location}</p>
                              </div>
                              <div className="text-right">
                                <span className="block font-bold text-slate-900">{report.score}%</span>
                                <span className="text-[10px] text-slate-400 font-medium uppercase">Score</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {step === 'CAPTURE' && (
                  <motion.div 
                    key="capture"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-black flex flex-col sm:rounded-3xl overflow-hidden"
                  >
                    <div className="p-6 flex justify-between items-center text-white bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10">
                      <button onClick={() => { stopCapture(); setStep('HOME'); }} className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                        <XCircle size={24} />
                      </button>
                      <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-sm font-bold">
                        Photo {photos.length + 1}/4
                      </div>
                    </div>
                    
                    <div className="flex-1 relative flex items-center justify-center">
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        className="w-full h-full object-cover"
                      />
                      {/* Overlay Guide */}
                      <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none flex items-center justify-center">
                        <div className="w-full h-full border-2 border-dashed border-white/50 rounded-2xl" />
                      </div>
                      
                      <div className="absolute bottom-32 left-0 right-0 text-center">
                        <p className="text-white font-bold text-sm bg-black/60 backdrop-blur-md py-3 px-6 inline-block rounded-full shadow-lg">
                          {photos.length === 0 ? "Capture Front View" : 
                           photos.length === 1 ? "Capture Back View" : 
                           photos.length === 2 ? "Capture Left Side" : "Capture Right Side"}
                        </p>
                      </div>
                    </div>

                    <div className="p-8 bg-black pb-12 flex justify-center items-center absolute bottom-0 left-0 right-0">
                      <canvas ref={canvasRef} className="hidden" />
                      <button 
                        onClick={takePhoto}
                        className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1 hover:scale-105 transition-transform"
                      >
                        <div className="w-full h-full rounded-full bg-white" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 'ANALYZING' && (
                  <motion.div 
                    key="analyzing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center p-12 space-y-8 h-[80vh]"
                  >
                    <div className="relative w-32 h-32">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 border-4 border-slate-200 border-t-orange-500 rounded-full"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-white rounded-full m-2 shadow-sm">
                        <ShieldCheck size={40} className="text-orange-500" />
                      </div>
                    </div>
                    <div className="text-center space-y-3">
                      <h2 className="text-2xl font-bold text-slate-900">Analyzing Evidence</h2>
                      <p className="text-sm text-slate-500 font-medium">Running AI vision models & geo-spatial checks...</p>
                      <div className="inline-flex items-center gap-2 mt-4 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full text-xs font-bold">
                        <CheckCircle size={14} />
                        Blurring faces automatically (privacy)
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 'RESULT' && analysis && (
                  <motion.div 
                    key="result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 space-y-6"
                  >
                    {/* Verdict Card */}
                    <div className={`p-8 rounded-3xl shadow-sm flex flex-col items-center text-center space-y-4 ${
                      analysis.verdict === 'WRONG_PARKING' ? 'bg-red-50 border border-red-100' : 
                      analysis.verdict === 'SUSPICIOUS' ? 'bg-orange-50 border border-orange-100' : 'bg-emerald-50 border border-emerald-100'
                    }`}>
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-2 bg-white shadow-sm ${
                        analysis.verdict === 'WRONG_PARKING' ? 'text-red-500' : 
                        analysis.verdict === 'SUSPICIOUS' ? 'text-orange-500' : 'text-emerald-500'
                      }`}>
                        {analysis.verdict === 'WRONG_PARKING' ? <XCircle size={40} /> : 
                         analysis.verdict === 'SUSPICIOUS' ? <AlertTriangle size={40} /> : 
                         <CheckCircle size={40} />}
                      </div>
                      
                      <div>
                        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-1">{analysis.verdict.replace('_', ' ')}</h2>
                        <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm mt-2">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confidence Score</span>
                          <span className="text-sm font-black text-slate-900">{analysis.score}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4">
                      <h3 className="text-sm font-bold text-slate-900">Detected Violations</h3>
                      <div className="space-y-3">
                        {analysis.reason_codes.map(code => (
                          <div key={code} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                              <AlertTriangle size={16} />
                            </div>
                            <span className="font-semibold text-slate-700 text-sm">{code.replace('_', ' ')}</span>
                          </div>
                        ))}
                        {analysis.reason_codes.length === 0 && (
                          <p className="text-sm text-slate-500 font-medium text-center py-4">No specific violations detected in the image.</p>
                        )}
                      </div>
                    </div>

                    {/* Action Ladder */}
                    <div className="space-y-3 pt-4">
                      <button className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/30">
                        <ShieldAlert size={18} />
                        Send Alert
                      </button>
                      <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20">
                        <PhoneCall size={18} />
                        Call Vehicle Owner
                      </button>
                      <button className="w-full bg-white border border-slate-200 text-red-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-50 transition-all shadow-sm">
                        <AlertTriangle size={18} />
                        SOS Parking Helpline
                      </button>
                      <button 
                        onClick={() => { setStep('HOME'); setPhotos([]); setAnalysis(null); }}
                        className="w-full py-4 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors mt-2"
                      >
                        Back to Dashboard
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 'PROFILE' && (
                  <motion.div 
                    key="profile"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-6 space-y-8"
                  >
                    <div className="flex items-center gap-5 p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
                      <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-orange-500/30">
                        {user?.username[0].toUpperCase()}
                      </div>
                      <div>
                        <h2 className="text-2xl font-extrabold text-slate-900">{user?.username}</h2>
                        <div className="inline-flex items-center gap-1 mt-1 bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md text-xs font-bold">
                          <CheckCircle size={12} />
                          Verified Reporter
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center px-1">
                        <h3 className="text-sm font-bold text-slate-800">My Vehicles</h3>
                        <button 
                          onClick={() => setStep('ADD_VEHICLE')}
                          className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center hover:bg-orange-200 transition-colors"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        {vehicles.map(v => (
                          <div key={v.id} className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm flex justify-between items-center hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                                <Car size={24} />
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{v.plate}</p>
                                <p className="text-xs font-medium text-slate-500">{v.color} {v.model}</p>
                              </div>
                            </div>
                            <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                              <Settings size={20} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-8">
                      <button 
                        onClick={handleLogout}
                        className="w-full bg-red-50 text-red-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
                      >
                        <LogOut size={18} />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 'ADD_VEHICLE' && (
                  <motion.div 
                    key="add_vehicle"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 space-y-6"
                  >
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                      <form className="space-y-5" onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        setVehicles([...vehicles, {
                          id: Math.random().toString(),
                          plate: formData.get('plate') as string,
                          model: formData.get('model') as string,
                          color: formData.get('color') as string,
                        }]);
                        setStep('PROFILE');
                      }}>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">License Plate</label>
                          <input name="plate" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all" placeholder="e.g. HR 26 DQ 1234" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Vehicle Model</label>
                          <input name="model" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all" placeholder="e.g. Maruti Swift" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Color</label>
                          <input name="color" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all" placeholder="e.g. White" />
                        </div>
                        <div className="pt-4">
                          <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20">
                            Save Vehicle
                          </button>
                        </div>
                      </form>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </main>

            {/* Floating Bottom Nav */}
            <div className="absolute bottom-6 left-6 right-6">
              <nav className="bg-slate-900 text-slate-400 rounded-full p-2 flex justify-between items-center shadow-2xl shadow-slate-900/40 backdrop-blur-lg">
                <button onClick={() => setStep('HOME')} className={`flex-1 py-3 flex justify-center rounded-full transition-all ${step === 'HOME' ? 'bg-slate-800 text-white' : 'hover:text-white'}`}>
                  <History size={22} />
                </button>
                <button onClick={startCapture} className="w-14 h-14 bg-orange-500 text-white rounded-full flex items-center justify-center -mt-8 shadow-lg shadow-orange-500/40 border-4 border-slate-50 hover:scale-105 transition-transform">
                  <Camera size={24} />
                </button>
                <button onClick={() => setStep('PROFILE')} className={`flex-1 py-3 flex justify-center rounded-full transition-all ${step === 'PROFILE' || step === 'ADD_VEHICLE' ? 'bg-slate-800 text-white' : 'hover:text-white'}`}>
                  <User size={22} />
                </button>
              </nav>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
