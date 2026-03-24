import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;

class ApiService {
  static const String baseUrl = "http://YOUR_BACKEND_IP:8000";
  static String? _token;

  static Future<Map<String, dynamic>> login(String username, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/login'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'username': username, 'password': password}),
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      _token = data['token'];
      return data;
    } else {
      throw Exception('Login failed: ${response.body}');
    }
  }

  static Future<Map<String, dynamic>> register(String username, String password, String phone) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/register'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'username': username, 'password': password, 'phone': phone}),
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Registration failed');
    }
  }

  static Future<List<dynamic>> getVehicles() async {
    final response = await http.get(Uri.parse('$baseUrl/api/vehicles?username=admin'));
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to load vehicles');
    }
  }

  static Future<Map<String, dynamic>> addVehicle(String plate, String model, String color) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/vehicles?username=admin'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'plate': plate, 'model': model, 'color': color}),
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to add vehicle');
    }
  }

  static Future<Map<String, dynamic>> analyzeParking(File imageFile) async {
    var request = http.MultipartRequest('POST', Uri.parse('$baseUrl/api/analyze'));
    request.files.add(await http.MultipartFile.fromPath('file', imageFile.path));
    
    var streamedResponse = await request.send();
    var response = await http.Response.fromStream(streamedResponse);
    
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to analyze image');
    }
  }

  static Future<Map<String, dynamic>> geoCheck(double lat, double lng) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/geo-check'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'lat': lat, 'lng': lng}),
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed geo check');
    }
  }
}
