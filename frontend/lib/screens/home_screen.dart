import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import '../services/api_service.dart';
import 'capture_screen.dart';
import 'profile_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<dynamic> _reports = [];
  bool _isLoading = true;
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    _fetchReports();
  }

  Future<void> _fetchReports() async {
    try {
      final reports = await ApiService.getReports();
      setState(() {
        _reports = reports;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        title: Text(
          _currentIndex == 0 ? "ParkingMudde" : "Profile",
          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 20, color: Color(0xFF0F172A), letterSpacing: -0.5),
        ),
        actions: [
          if (_currentIndex == 0)
            IconButton(
              onPressed: _fetchReports, 
              icon: const Icon(Icons.refresh, color: Color(0xFF64748B))
            ),
          const SizedBox(width: 8),
        ],
      ),
      body: _currentIndex == 1 
        ? const ProfileScreen()
        : RefreshIndicator(
            onRefresh: _fetchReports,
            color: const Color(0xFFF97316),
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  FadeInDown(
                    child: Container(
                      padding: const EdgeInsets.all(32),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0F172A),
                        borderRadius: BorderRadius.circular(32),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF0F172A).withOpacity(0.2),
                            blurRadius: 24,
                            offset: const Offset(0, 12),
                          )
                        ]
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            "Reports Today",
                            style: TextStyle(color: Color(0xFF94A3B8), fontSize: 14, fontWeight: FontWeight.w500),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                _reports.length.toString().padLeft(2, '0'),
                                style: const TextStyle(color: Colors.white, fontSize: 56, fontWeight: FontWeight.w800, height: 1),
                              ),
                              const Icon(Icons.shield_outlined, color: Color(0xFF334155), size: 64),
                            ],
                          ),
                          const SizedBox(height: 32),
                          SizedBox(
                            width: double.infinity,
                            height: 60,
                            child: ElevatedButton.icon(
                              onPressed: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(builder: (context) => const CaptureScreen()),
                                ).then((_) => _fetchReports());
                              },
                              icon: const Icon(Icons.camera_alt),
                              label: const Text("Report Violation", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFFF97316),
                                foregroundColor: Colors.white,
                                elevation: 8,
                                shadowColor: const Color(0xFFF97316).withOpacity(0.4),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        "Recent Activity",
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFF0F172A)),
                      ),
                      TextButton(
                        onPressed: () {},
                        child: const Text("View All", style: TextStyle(color: Color(0xFFF97316), fontWeight: FontWeight.w600)),
                      )
                    ],
                  ),
                  const SizedBox(height: 16),
                  if (_isLoading)
                    const Center(child: Padding(padding: EdgeInsets.all(40), child: CircularProgressIndicator(color: Color(0xFFF97316))))
                  else if (_reports.isEmpty)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(40),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: const Color(0xFFF1F5F9)),
                      ),
                      child: Column(
                        children: const [
                          Icon(Icons.history, size: 48, color: Color(0xFFE2E8F0)),
                          SizedBox(height: 16),
                          Text("No reports filed yet", style: TextStyle(color: Color(0xFF94A3B8), fontWeight: FontWeight.w500)),
                        ],
                      ),
                    )
                  else
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _reports.length,
                      separatorBuilder: (context, index) => const SizedBox(height: 12),
                      itemBuilder: (context, index) {
                        final report = _reports[index];
                        final bool isWrong = report['verdict'] == 'WRONG_PARKING';
                        final bool isSuspicious = report['verdict'] == 'SUSPICIOUS';
                        
                        return Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: const Color(0xFFF1F5F9)),
                            boxShadow: [
                              BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))
                            ]
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 48,
                                height: 48,
                                decoration: BoxDecoration(
                                  color: isWrong ? Colors.red.shade50 : (isSuspicious ? Colors.orange.shade50 : Colors.green.shade50),
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(
                                  isWrong ? Icons.cancel : (isSuspicious ? Icons.warning : Icons.check_circle),
                                  color: isWrong ? Colors.red : (isSuspicious ? Colors.orange : Colors.green),
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      report['verdict'].toString().replaceAll('_', ' '),
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF0F172A)),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      "${report['timestamp']} • ID: ${report['id']}",
                                      style: const TextStyle(fontSize: 12, color: Color(0xFF64748B), fontWeight: FontWeight.w500),
                                    ),
                                  ],
                                ),
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    "${report['score']}%",
                                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: Color(0xFF0F172A)),
                                  ),
                                  const Text(
                                    "SCORE",
                                    style: TextStyle(fontSize: 10, color: Color(0xFF94A3B8), fontWeight: FontWeight.bold),
                                  ),
                                ],
                              )
                            ],
                          ),
                        );
                      },
                    ),
                ],
              ),
            ),
          ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => const CaptureScreen()),
          ).then((_) => _fetchReports());
        },
        backgroundColor: const Color(0xFFF97316),
        elevation: 8,
        shape: const CircleBorder(),
        child: const Icon(Icons.camera_alt, color: Colors.white),
      ),
      bottomNavigationBar: BottomAppBar(
        shape: const CircularNotchedRectangle(),
        notchMargin: 8,
        color: const Color(0xFF0F172A),
        child: SizedBox(
          height: 60,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              IconButton(
                icon: Icon(Icons.history, color: _currentIndex == 0 ? Colors.white : const Color(0xFF64748B)),
                onPressed: () => setState(() => _currentIndex = 0),
              ),
              const SizedBox(width: 40), // Space for FAB
              IconButton(
                icon: Icon(Icons.person_outline, color: _currentIndex == 1 ? Colors.white : const Color(0xFF64748B)),
                onPressed: () => setState(() => _currentIndex = 1),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
