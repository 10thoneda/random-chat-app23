import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  ArrowLeft,
  Play,
  Gift,
  Coins,
  Star,
  Zap,
  X,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Sparkles,
  Crown,
  Flame,
  Diamond,
} from "lucide-react";
import { useCoin } from "../context/CoinProvider";
import { useNavigate } from "react-router-dom";

interface SpinResult {
  coins: number;
  message: string;
  requiresAd: boolean;
  color: string;
  icon: string;
}

const SpinWheel: React.FC = () => {
  const navigate = useNavigate();
  const { coins, addCoins, watchAd, adsWatchedToday, maxAdsPerDay } = useCoin();
  const wheelRef = useRef<HTMLDivElement>(null);

  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [hasSpunToday, setHasSpunToday] = useState(false);
  const [spinsToday, setSpinsToday] = useState(0);
  const [particles, setParticles] = useState<
    Array<{ id: number; x: number; y: number }>
  >([]);
  const maxSpinsPerDay = 3;

  // Enhanced wheel segments with vibrant colors and patterns
  const wheelSegments = [
    {
      coins: 10,
      color: "from-emerald-400 to-emerald-600",
      bgColor: "#10B981",
      label: "10 Coins",
      probability: 50,
      icon: "💎",
      pattern: "dots",
    },
    {
      coins: 0,
      color: "from-gray-400 to-gray-600",
      bgColor: "#6B7280",
      label: "Try Again",
      probability: 25,
      icon: "🔄",
      pattern: "stripes",
    },
    {
      coins: 20,
      color: "from-amber-400 to-orange-500",
      bgColor: "#F59E0B",
      label: "20 Coins",
      probability: 15,
      icon: "⭐",
      pattern: "zigzag",
    },
    {
      coins: 0,
      color: "from-slate-400 to-slate-600",
      bgColor: "#64748B",
      label: "Better Luck",
      probability: 7,
      icon: "🍀",
      pattern: "waves",
    },
    {
      coins: 50,
      color: "from-red-400 to-pink-500",
      bgColor: "#EF4444",
      label: "JACKPOT!",
      probability: 3,
      icon: "🎰",
      pattern: "stars",
    },
  ];

  useEffect(() => {
    // Check daily spin count from localStorage
    const today = new Date().toDateString();
    const lastSpinDate = localStorage.getItem("lastSpinDate");
    const savedSpinsToday = parseInt(localStorage.getItem("spinsToday") || "0");

    if (lastSpinDate === today) {
      setSpinsToday(savedSpinsToday);
      setHasSpunToday(savedSpinsToday >= maxSpinsPerDay);
    } else {
      // Reset for new day
      setSpinsToday(0);
      setHasSpunToday(false);
      localStorage.setItem("lastSpinDate", today);
      localStorage.setItem("spinsToday", "0");
    }
  }, []);

  // Create floating particles effect
  useEffect(() => {
    if (isSpinning) {
      const interval = setInterval(() => {
        setParticles((prev) =>
          [
            ...prev,
            {
              id: Date.now() + Math.random(),
              x: Math.random() * 100,
              y: Math.random() * 100,
            },
          ].slice(-20),
        ); // Keep only last 20 particles
      }, 200);

      return () => clearInterval(interval);
    } else {
      setParticles([]);
    }
  }, [isSpinning]);

  const getRandomResult = (): SpinResult => {
    const random = Math.random() * 100;
    let cumulativeProbability = 0;

    for (const segment of wheelSegments) {
      cumulativeProbability += segment.probability;
      if (random <= cumulativeProbability) {
        if (segment.coins === 0) {
          return {
            coins: 0,
            message: "Better luck next time! 🍀",
            requiresAd: false,
            color: segment.bgColor,
            icon: segment.icon,
          };
        } else {
          return {
            coins: segment.coins,
            message:
              segment.coins === 50
                ? `🎉 JACKPOT! You won ${segment.coins} coins! 🎉`
                : `Congratulations! You won ${segment.coins} coins! 🎉`,
            requiresAd: true,
            color: segment.bgColor,
            icon: segment.icon,
          };
        }
      }
    }

    // Fallback
    return {
      coins: 0,
      message: "Better luck next time! 🍀",
      requiresAd: false,
      color: "#6B7280",
      icon: "🔄",
    };
  };

  const spinWheel = () => {
    if (isSpinning || hasSpunToday) return;

    setIsSpinning(true);
    setShowResult(false);
    setResult(null);

    // Generate random rotation (4-8 full rotations + random angle)
    const randomRotation = 1440 + Math.random() * 1440; // 4-8 full rotations

    if (wheelRef.current) {
      wheelRef.current.style.transition =
        "transform 4s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
      wheelRef.current.style.transform = `rotate(${randomRotation}deg)`;
    }

    // Show result after animation
    setTimeout(() => {
      const spinResult = getRandomResult();
      setResult(spinResult);
      setShowResult(true);
      setIsSpinning(false);

      // Update daily spin count
      const newSpinsToday = spinsToday + 1;
      setSpinsToday(newSpinsToday);
      localStorage.setItem("spinsToday", newSpinsToday.toString());

      if (newSpinsToday >= maxSpinsPerDay) {
        setHasSpunToday(true);
      }
    }, 4000);
  };

  const handleClaimReward = async () => {
    if (!result) return;

    if (result.requiresAd && result.coins > 0) {
      // Check if user can watch more ads
      if (adsWatchedToday >= maxAdsPerDay) {
        alert("You've reached your daily ad limit. Come back tomorrow!");
        return;
      }

      try {
        // Simulate watching ad
        await watchAd();
        // Add coins after ad
        await addCoins(result.coins);
        alert(
          `🎉 Amazing! You watched an ad and earned ${result.coins} coins!`,
        );
        setShowResult(false);
        setResult(null);
      } catch (error) {
        alert("Failed to watch ad. Please try again.");
      }
    } else if (result.coins === 0) {
      // Offer to watch ad for 10 coins
      if (confirm("Watch an ad and win 10 coins instantly?")) {
        if (adsWatchedToday >= maxAdsPerDay) {
          alert("You've reached your daily ad limit. Come back tomorrow!");
          return;
        }

        try {
          await watchAd();
          await addCoins(10);
          alert("🎉 You watched an ad and earned 10 coins!");
          setShowResult(false);
          setResult(null);
        } catch (error) {
          alert("Failed to watch ad. Please try again.");
        }
      } else {
        setShowResult(false);
        setResult(null);
      }
    }
  };

  const resetDaily = () => {
    // For testing purposes - reset daily limit
    setSpinsToday(0);
    setHasSpunToday(false);
    localStorage.setItem("spinsToday", "0");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full animate-pulse"></div>
        <div
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-pink-500/20 to-red-500/20 rounded-full animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>

        {/* Floating particles */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-2 h-2 bg-white rounded-full opacity-60 animate-ping"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDuration: "2s",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white hover:text-yellow-300 font-semibold transition-colors duration-300 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2"
          >
            <ArrowLeft className="h-5 w-5" />
            Back
          </button>

          <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full px-6 py-3 shadow-2xl">
            <Coins className="h-6 w-6 text-white animate-pulse" />
            <span className="font-extrabold text-white text-lg">{coins}</span>
          </div>
        </div>

        {/* Main Card */}
        <Card className="max-w-lg mx-auto bg-white/95 backdrop-blur-sm border-2 border-white/50 shadow-3xl relative overflow-hidden">
          {/* Card glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-red-500/20 animate-pulse"></div>

          <CardHeader className="text-center relative z-10">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="text-6xl animate-bounce">🎰</div>
                <div className="absolute -top-2 -right-2 text-2xl animate-ping">
                  ✨
                </div>
                <div
                  className="absolute -bottom-2 -left-2 text-xl animate-ping"
                  style={{ animationDelay: "0.5s" }}
                >
                  ⭐
                </div>
              </div>
            </div>

            <CardTitle className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent mb-4 animate-pulse">
              Spin & Win Fortune!
            </CardTitle>

            <p className="text-purple-700 font-bold text-lg mb-4">
              🎲 Test your luck and win amazing rewards! 🎲
            </p>

            {/* Enhanced Daily Spin Counter */}
            <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-2xl px-6 py-4 border-2 border-purple-200">
              <div className="flex items-center gap-3 justify-center">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-full">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div className="text-center">
                  <div className="text-purple-800 font-bold text-lg">
                    Daily Spins: {spinsToday}/{maxSpinsPerDay}
                  </div>
                  <div className="text-purple-600 text-sm font-medium">
                    {maxSpinsPerDay - spinsToday} spins remaining today
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-8 relative z-10">
            {/* Enhanced Spinning Wheel */}
            <div className="relative flex justify-center">
              <div className="relative">
                {/* Outer glow ring */}
                <div className="absolute -inset-4 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-full opacity-50 blur-lg animate-pulse"></div>

                {/* Wheel Container */}
                <div
                  ref={wheelRef}
                  className="relative w-80 h-80 rounded-full border-8 border-white shadow-2xl overflow-hidden"
                  style={{
                    background: `conic-gradient(
                      from 0deg,
                      #10B981 0deg 72deg,
                      #6B7280 72deg 144deg,
                      #F59E0B 144deg 216deg,
                      #64748B 216deg 288deg,
                      #EF4444 288deg 360deg
                    )`,
                  }}
                >
                  {/* Decorative patterns overlay */}
                  <div className="absolute inset-0">
                    {/* Segment dividers */}
                    {[0, 72, 144, 216, 288].map((angle, index) => (
                      <div
                        key={index}
                        className="absolute w-full h-0.5 bg-white/50 origin-left top-1/2"
                        style={{
                          transform: `rotate(${angle}deg)`,
                          transformOrigin: "50% 50%",
                        }}
                      />
                    ))}

                    {/* Center circle with animated elements */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white rounded-full w-24 h-24 flex items-center justify-center shadow-xl border-4 border-yellow-400">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600 animate-pulse">
                            SPIN
                          </div>
                          <div className="text-xs font-bold text-gray-600">
                            TO WIN!
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Segment labels and icons positioned around the wheel */}
                  <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-center">
                    <div className="text-2xl">💎</div>
                    <div className="text-white font-bold text-sm drop-shadow-lg">
                      10
                    </div>
                  </div>

                  <div className="absolute right-8 top-1/2 transform -translate-y-1/2 text-center">
                    <div className="text-2xl">🔄</div>
                    <div className="text-white font-bold text-sm drop-shadow-lg">
                      Try
                    </div>
                  </div>

                  <div className="absolute bottom-12 right-12 text-center">
                    <div className="text-2xl">⭐</div>
                    <div className="text-white font-bold text-sm drop-shadow-lg">
                      20
                    </div>
                  </div>

                  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center">
                    <div className="text-2xl">🍀</div>
                    <div className="text-white font-bold text-sm drop-shadow-lg">
                      Luck
                    </div>
                  </div>

                  <div className="absolute bottom-12 left-12 text-center">
                    <div className="text-3xl animate-pulse">🎰</div>
                    <div className="text-white font-bold text-sm drop-shadow-lg">
                      50!
                    </div>
                  </div>
                </div>

                {/* Enhanced Pointer */}
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-20">
                  <div className="relative">
                    <div className="w-0 h-0 border-l-6 border-r-6 border-b-12 border-l-transparent border-r-transparent border-b-yellow-400 drop-shadow-2xl"></div>
                    <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-yellow-400 rounded-full shadow-lg"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Spin Button */}
            <div className="text-center space-y-4">
              {hasSpunToday ? (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 font-bold py-4 px-8 rounded-2xl shadow-inner border-2 border-gray-300">
                    <div className="text-lg">🎯 Daily Limit Reached!</div>
                    <div className="text-sm mt-2">
                      Come back tomorrow for more spins!
                    </div>
                  </div>
                  <button
                    onClick={resetDaily}
                    className="text-xs text-purple-600 underline hover:text-purple-800 transition-colors"
                  >
                    🔧 Reset for testing
                  </button>
                </div>
              ) : (
                <Button
                  onClick={spinWheel}
                  disabled={isSpinning}
                  className={`px-12 py-6 rounded-2xl font-extrabold text-xl shadow-2xl transition-all duration-300 transform border-4 ${
                    isSpinning
                      ? "bg-gray-400 cursor-not-allowed border-gray-500 scale-95"
                      : "bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:via-pink-600 hover:to-red-600 hover:shadow-3xl hover:scale-105 border-white"
                  }`}
                >
                  {isSpinning ? (
                    <div className="flex items-center gap-3">
                      <RotateCcw className="h-7 w-7 animate-spin" />
                      <span>🌟 Spinning Magic... 🌟</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Play className="h-7 w-7" />
                      <span>🚀 SPIN THE WHEEL! 🚀</span>
                    </div>
                  )}
                </Button>
              )}
            </div>

            {/* Motivational message */}
            <div className="text-center bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
              <div className="text-purple-800 font-bold text-lg mb-2">
                🎪 Every spin is a chance to win! 🎪
              </div>
              <div className="text-purple-600 text-sm">
                Watch ads to claim your rewards and support the app! 📺✨
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Result Modal */}
      {showResult && result && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative">
            {/* Confetti effect for wins */}
            {result.coins > 0 && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-3 h-3 bg-yellow-400 animate-bounce opacity-80"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 2}s`,
                      animationDuration: `${1 + Math.random()}s`,
                    }}
                  />
                ))}
              </div>
            )}

            <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-4 border-white shadow-3xl relative overflow-hidden">
              {/* Result glow effect */}
              <div
                className="absolute inset-0 opacity-20 animate-pulse"
                style={{ backgroundColor: result.color }}
              />

              <CardHeader className="text-center relative z-10">
                <div className="flex justify-center mb-6">
                  {result.coins > 0 ? (
                    <div className="relative">
                      <div className="text-8xl animate-bounce">
                        {result.icon}
                      </div>
                      <div className="absolute -top-4 -right-4 text-4xl animate-ping">
                        🎉
                      </div>
                      <div
                        className="absolute -bottom-4 -left-4 text-3xl animate-ping"
                        style={{ animationDelay: "0.5s" }}
                      >
                        ✨
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="text-6xl">{result.icon}</div>
                      <div className="absolute -top-2 -right-2 text-2xl animate-pulse">
                        💫
                      </div>
                    </div>
                  )}
                </div>

                <CardTitle className="text-2xl font-extrabold mb-4">
                  {result.coins > 0 ? (
                    <div className="space-y-2">
                      <div className="text-3xl bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                        🎊 WINNER! 🎊
                      </div>
                      <div className="text-lg text-gray-700">
                        You won{" "}
                        <span className="text-green-600 font-extrabold">
                          {result.coins} coins!
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-600">
                      Better Luck Next Time! 🍀
                    </div>
                  )}
                </CardTitle>

                <p className="text-gray-600 font-medium">{result.message}</p>
              </CardHeader>

              <CardContent className="space-y-6 relative z-10">
                {result.requiresAd && result.coins > 0 ? (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Play className="h-6 w-6 text-blue-600" />
                        <p className="text-blue-800 font-bold">
                          🎬 Watch a quick ad to claim your {result.coins}{" "}
                          coins!
                        </p>
                      </div>
                      <p className="text-blue-600 text-sm">
                        Supporting ads helps us keep the app free for everyone!
                        💙
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={handleClaimReward}
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 py-3 font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300"
                      >
                        <Play className="h-5 w-5 mr-2" />
                        Watch Ad & Claim! 🎉
                      </Button>
                      <Button
                        onClick={() => setShowResult(false)}
                        variant="outline"
                        className="flex-1 py-3 font-bold border-2 hover:bg-gray-50"
                      >
                        Maybe Later
                      </Button>
                    </div>
                  </div>
                ) : result.coins === 0 ? (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Gift className="h-6 w-6 text-orange-600" />
                        <p className="text-orange-800 font-bold">
                          🎁 Don't give up! Watch an ad and get 10 coins
                          instantly!
                        </p>
                      </div>
                      <p className="text-orange-600 text-sm">
                        Turn your luck around with a guaranteed reward! 🌟
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={handleClaimReward}
                        className="flex-1 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 py-3 font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300"
                      >
                        <Play className="h-5 w-5 mr-2" />
                        Watch Ad & Get 10 Coins! 🪙
                      </Button>
                      <Button
                        onClick={() => setShowResult(false)}
                        variant="outline"
                        className="flex-1 py-3 font-bold border-2 hover:bg-gray-50"
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => setShowResult(false)}
                    className="w-full py-3 font-bold text-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    Try Again Tomorrow! 🌅
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpinWheel;
