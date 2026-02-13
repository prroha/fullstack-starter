import 'package:flutter/material.dart';
import 'ecommerce_service.dart';
import 'product_detail_screen.dart';

/// Product catalog screen — lists products with search and category filtering.
/// Placeholder implementation; wire up with Riverpod providers in production.
class ProductScreen extends StatefulWidget {
  final EcommerceService service;

  const ProductScreen({super.key, required this.service});

  @override
  State<ProductScreen> createState() => _ProductScreenState();
}

class _ProductScreenState extends State<ProductScreen> {
  List<dynamic> _products = [];
  List<dynamic> _categories = [];
  bool _loading = true;
  String? _error;
  String _search = '';
  String? _selectedCategory;
  int _page = 1;

  @override
  void initState() {
    super.initState();
    _fetchCategories();
    _fetchProducts();
  }

  Future<void> _fetchCategories() async {
    try {
      final categories = await widget.service.getCategories();
      if (mounted) setState(() => _categories = categories);
    } catch (_) {
      // Non-critical
    }
  }

  Future<void> _fetchProducts() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final result = await widget.service.getProducts(
        search: _search.isEmpty ? null : _search,
        category: _selectedCategory,
        page: _page,
      );
      final data = result['data'] ?? {};
      if (mounted) {
        setState(() {
          _products = data['items'] ?? [];
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Shop'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(56),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: TextField(
              decoration: const InputDecoration(
                hintText: 'Search products...',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(),
                contentPadding: EdgeInsets.symmetric(vertical: 0, horizontal: 12),
              ),
              onChanged: (value) {
                _search = value;
                _page = 1;
                _fetchProducts();
              },
            ),
          ),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(_error!, style: const TextStyle(color: Colors.red)),
                      const SizedBox(height: 8),
                      ElevatedButton(
                        onPressed: _fetchProducts,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : _products.isEmpty
                  ? const Center(child: Text('No products found'))
                  : GridView.builder(
                      padding: const EdgeInsets.all(16),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        childAspectRatio: 0.7,
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                      ),
                      itemCount: _products.length,
                      itemBuilder: (context, index) {
                        final product = _products[index] as Map<String, dynamic>;
                        return _ProductCard(
                          product: product,
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => ProductDetailScreen(
                                  service: widget.service,
                                  productSlug: product['slug'] ?? '',
                                ),
                              ),
                            );
                          },
                        );
                      },
                    ),
    );
  }
}

class _ProductCard extends StatelessWidget {
  final Map<String, dynamic> product;
  final VoidCallback? onTap;

  const _ProductCard({required this.product, this.onTap});

  @override
  Widget build(BuildContext context) {
    final title = product['title'] ?? 'Untitled';
    final price = (product['price'] ?? 0) as num;
    final images = product['images'] as List<dynamic>? ?? [];
    final imageUrl = images.isNotEmpty ? images[0]['url'] as String? : null;

    return GestureDetector(
      onTap: onTap,
      child: Card(
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: imageUrl != null
                  ? Image.network(imageUrl, fit: BoxFit.cover, width: double.infinity)
                  : Container(
                      color: Colors.grey[200],
                      child: const Center(child: Icon(Icons.shopping_bag, size: 40, color: Colors.grey)),
                    ),
            ),
            Padding(
              padding: const EdgeInsets.all(8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                  const SizedBox(height: 4),
                  Text(
                    price == 0 ? 'Free' : '\$${(price / 100).toStringAsFixed(2)}',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
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
