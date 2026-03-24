import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';

class ResultScreen extends StatelessWidget {
  final Map<String, dynamic> result;

  const ResultScreen({super.key, required this.result});

  @override
  Widget build(BuildContext context) {
    final bool isWrong = result['verdict'] == 'WRONG_PARKING';
    final bool isSuspicious = result['verdict'] == 'SUSPICIOUS';
    final Color mainColor = isWrong ? Colors.red : (isSuspicious ? Colors.orange : Colors.green);
    final Color bgColor = isWrong ? Colors.red.shade50 : (isSuspicious ? Colors.orange.shade50 : Colors.green.shade50);
    final IconData mainIcon = isWrong ? Icons.cancel : (isSuspicious ? Icons.warning : Icons.check_circle);

    List<dynamic> reasons = result['reason_codes'] ?? [];

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF0F172A)),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            FadeInDown(
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(32),
                decoration: BoxDecoration(
                  color: bgColor,
                  borderRadius: BorderRadius.circular(32),
                  border: Border.all(color: mainColor.withOpacity(0.2)),
                ),
                child: Column(
                  children: [
                    Container(
                      width: 80,
                      height: 80,
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(mainIcon, color: mainColor, size: 40),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      result['verdict'].toString().replaceAll('_', ' '),
                      style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w800, color: Color(0xFF0F172A), letterSpacing: -1),
                    ),
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Text("CONFIDENCE SCORE", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Color(0xFF64748B), letterSpacing: 1)),
                          const SizedBox(width: 8),
                          Text("${result['score']}%", style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF0F172A))),
                        ],
                      ),
                    )
                  ],
                ),
              ),
            ),
            const SizedBox(height: 32),
            FadeInUp(
              delay: const Duration(milliseconds: 200),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(32),
                  border: Border.all(color: const Color(0xFFF1F5F9)),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 20, offset: const Offset(0, 10))
                  ]
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text("Detected Violations", style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFF0F172A))),
                    const SizedBox(height: 16),
                    if (reasons.isEmpty)
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 16),
                        child: Text("No specific violations detected in the image.", style: TextStyle(color: Color(0xFF64748B), fontWeight: FontWeight.w500)),
                      )
                    else
                      ...reasons.map((reason) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: const Color(0xFFF1F5F9)),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 32,
                                height: 32,
                                decoration: BoxDecoration(
                                  color: Colors.orange.shade50,
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.warning_amber_rounded, color: Colors.orange, size: 16),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  reason.toString().replaceAll('_', ' '),
                                  style: const TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF334155)),
                                ),
                              )
                            ],
                          ),
                        ),
                      )).toList(),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 32),
            FadeInUp(
              delay: const Duration(milliseconds: 400),
              child: Column(
                children: [
                  SizedBox(
                    width: double.infinity,
                    height: 60,
                    child: ElevatedButton.icon(
                      onPressed: () {},
                      icon: const Icon(Icons.warning_rounded),
                      label: const Text("Send Alert", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFF97316),
                        foregroundColor: Colors.white,
                        elevation: 10,
                        shadowColor: const Color(0xFFF97316).withOpacity(0.3),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    height: 60,
                    child: ElevatedButton.icon(
                      onPressed: () {},
                      icon: const Icon(Icons.phone),
                      label: const Text("Call Vehicle Owner", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0F172A),
                        foregroundColor: Colors.white,
                        elevation: 10,
                        shadowColor: const Color(0xFF0F172A).withOpacity(0.3),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    height: 60,
                    child: OutlinedButton.icon(
                      onPressed: () {},
                      icon: const Icon(Icons.emergency),
                      label: const Text("SOS Parking Helpline", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.red.shade600,
                        side: BorderSide(color: Colors.red.shade200, width: 2),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text("Back to Dashboard", style: TextStyle(color: Color(0xFF64748B), fontWeight: FontWeight.w700)),
                  )
                ],
              ),
            )
          ],
        ),
      ),
    );
  }
}
