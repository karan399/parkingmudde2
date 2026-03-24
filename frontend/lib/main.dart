import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'screens/splash_screen.dart';

void main() {
  runApp(const ParkingMuddeApp());
}

class ParkingMuddeApp extends StatelessWidget {
  const ParkingMuddeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ParkingMudde',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFF97316), // orange-500
          primary: const Color(0xFFF97316),
          secondary: const Color(0xFF0F172A), // slate-900
          background: const Color(0xFFF8FAFC), // slate-50
          surface: Colors.white,
        ),
        textTheme: GoogleFonts.interTextTheme(),
        scaffoldBackgroundColor: const Color(0xFFF8FAFC),
      ),
      home: const SplashScreen(),
    );
  }
}
