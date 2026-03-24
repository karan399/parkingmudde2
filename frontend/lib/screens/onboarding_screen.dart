import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import 'login_screen.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentIndex = 0;

  final List<Map<String, dynamic>> _onboardingData = [
    {
      "title": "Snap & Report",
      "desc": "Spotted a wrongly parked vehicle? Capture 4 photos and let our AI do the heavy lifting.",
      "icon": Icons.camera_alt_rounded,
      "color": const Color(0xFFFFEDD5), // orange-100
      "iconColor": const Color(0xFFF97316), // orange-500
    },
    {
      "title": "Smart AI & Geo-Rules",
      "desc": "Instantly detects footpaths, zebra crossings, and no-parking zones using advanced vision and GPS.",
      "icon": Icons.map_rounded,
      "color": const Color(0xFFD1FAE5), // emerald-100
      "iconColor": const Color(0xFF10B981), // emerald-500
    },
    {
      "title": "Take Action & SOS",
      "desc": "Send alerts, call vehicle owners anonymously, or trigger SOS for severe obstructions.",
      "icon": Icons.shield_rounded,
      "color": const Color(0xFFDBEAFE), // blue-100
      "iconColor": const Color(0xFF3B82F6), // blue-500
    }
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            Align(
              alignment: Alignment.topRight,
              child: TextButton(
                onPressed: () => Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginScreen())),
                child: const Text("Skip", style: TextStyle(color: Color(0xFF94A3B8), fontWeight: FontWeight.bold)),
              ),
            ),
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                onPageChanged: (index) => setState(() => _currentIndex = index),
                itemCount: _onboardingData.length,
                itemBuilder: (context, index) {
                  final data = _onboardingData[index];
                  return Padding(
                    padding: const EdgeInsets.all(40.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        FadeInDown(
                          child: Container(
                            width: 160,
                            height: 160,
                            decoration: BoxDecoration(
                              color: data["color"],
                              shape: BoxShape.circle,
                            ),
                            child: Icon(data["icon"], size: 80, color: data["iconColor"]),
                          ),
                        ),
                        const SizedBox(height: 48),
                        FadeInUp(
                          child: Text(
                            data["title"],
                            textAlign: TextAlign.center,
                            style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Color(0xFF0F172A), letterSpacing: -0.5),
                          ),
                        ),
                        const SizedBox(height: 16),
                        FadeInUp(
                          delay: const Duration(milliseconds: 100),
                          child: Text(
                            data["desc"],
                            textAlign: TextAlign.center,
                            style: const TextStyle(fontSize: 15, color: Color(0xFF64748B), height: 1.5, fontWeight: FontWeight.w500),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(32.0),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(
                      _onboardingData.length,
                      (index) => AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        height: 8,
                        width: _currentIndex == index ? 32 : 8,
                        decoration: BoxDecoration(
                          color: _currentIndex == index ? const Color(0xFFF97316) : const Color(0xFFE2E8F0),
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),
                  SizedBox(
                    width: double.infinity,
                    height: 60,
                    child: ElevatedButton(
                      onPressed: () {
                        if (_currentIndex < _onboardingData.length - 1) {
                          _pageController.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
                        } else {
                          Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0F172A),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                        elevation: 10,
                        shadowColor: const Color(0xFF0F172A).withOpacity(0.3),
                      ),
                      child: Text(
                        _currentIndex < _onboardingData.length - 1 ? "Next" : "Get Started",
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
