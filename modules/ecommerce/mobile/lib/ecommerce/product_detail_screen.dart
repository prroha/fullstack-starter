import 'package:flutter/material.dart';
import 'ecommerce_service.dart';

/// Product detail screen — shows product info, images, variants, reviews.
/// Placeholder implementation; wire up with Riverpod providers in production.
class ProductDetailScreen extends StatefulWidget {
  final EcommerceService service;
  final String productSlug;

  const ProductDetailScreen({
    super.key,
    required this.service,
    required this.productSlug,
  });

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  Map<String, dynamic>? _product;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchProduct();
  }

  Future<void> _fetchProduct() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final result = await widget.service.getProductBySlug(widget.productSlug);
      if (mounted) {
        setState(() {
          _product = result['data'] as Map<String, dynamic>?;
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
        title: Text(_product?['title'] ?? 'Product'),
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
                        onPressed: _fetchProduct,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : _product == null
                  ? const Center(child: Text('Product not found'))
                  : SingleChildScrollView(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Product image
                          _buildImage(),
                          Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Title
                                Text(
                                  _product!['title'] ?? '',
                                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                                ),
                                const SizedBox(height: 8),

                                // Price
                                _buildPrice(),
                                const SizedBox(height: 12),

                                // Description
                                Text(
                                  _product!['description'] ?? '',
                                  style: Theme.of(context).textTheme.bodyMedium,
                                ),
                                const SizedBox(height: 16),

                                // Stock
                                _buildStock(),
                                const SizedBox(height: 24),

                                // Add to cart button
                                SizedBox(
                                  width: double.infinity,
                                  child: ElevatedButton.icon(
                                    onPressed: (_product!['stock'] ?? 0) > 0
                                        ? () {
                                            ScaffoldMessenger.of(context).showSnackBar(
                                              const SnackBar(content: Text('Added to cart')),
                                            );
                                          }
                                        : null,
                                    icon: const Icon(Icons.shopping_cart),
                                    label: Text(
                                      (_product!['stock'] ?? 0) > 0 ? 'Add to Cart' : 'Out of Stock',
                                    ),
                                    style: ElevatedButton.styleFrom(
                                      padding: const EdgeInsets.symmetric(vertical: 14),
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

  Widget _buildImage() {
    final images = _product!['images'] as List<dynamic>? ?? [];
    if (images.isNotEmpty) {
      final url = images[0]['url'] as String?;
      if (url != null) {
        return AspectRatio(
          aspectRatio: 1,
          child: Image.network(url, fit: BoxFit.cover, width: double.infinity),
        );
      }
    }

    return AspectRatio(
      aspectRatio: 1,
      child: Container(
        color: Colors.grey[200],
        child: const Center(
          child: Icon(Icons.shopping_bag, size: 64, color: Colors.grey),
        ),
      ),
    );
  }

  Widget _buildPrice() {
    final price = (_product!['price'] ?? 0) as num;
    final compareAtPrice = _product!['compareAtPrice'] as num?;

    return Row(
      children: [
        Text(
          price == 0 ? 'Free' : '\$${(price / 100).toStringAsFixed(2)}',
          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        ),
        if (compareAtPrice != null && compareAtPrice > price) ...[
          const SizedBox(width: 8),
          Text(
            '\$${(compareAtPrice / 100).toStringAsFixed(2)}',
            style: const TextStyle(
              fontSize: 16,
              color: Colors.grey,
              decoration: TextDecoration.lineThrough,
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: Colors.red[100],
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              '${((1 - price / compareAtPrice) * 100).round()}% off',
              style: TextStyle(fontSize: 12, color: Colors.red[700], fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildStock() {
    final stock = (_product!['stock'] ?? 0) as num;

    return Row(
      children: [
        Icon(
          stock > 0 ? Icons.check_circle : Icons.cancel,
          size: 16,
          color: stock > 0 ? Colors.green : Colors.red,
        ),
        const SizedBox(width: 4),
        Text(
          stock > 0 ? 'In Stock ($stock available)' : 'Out of Stock',
          style: TextStyle(
            color: stock > 0 ? Colors.green[700] : Colors.red[700],
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}
