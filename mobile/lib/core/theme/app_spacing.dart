import 'package:flutter/material.dart';

/// App spacing constants
class AppSpacing {
  // Base spacing values
  static const double xs = 4.0;
  static const double sm = 8.0;
  static const double md = 16.0;
  static const double lg = 24.0;
  static const double xl = 32.0;
  static const double xxl = 48.0;

  // Common paddings
  static const EdgeInsets screenPadding = EdgeInsets.all(md);
  static const EdgeInsets cardPadding = EdgeInsets.all(md);
  static const EdgeInsets buttonPadding = EdgeInsets.symmetric(
    horizontal: md,
    vertical: sm,
  );

  // Common gaps
  static const SizedBox gapXs = SizedBox(height: xs);
  static const SizedBox gapSm = SizedBox(height: sm);
  static const SizedBox gapMd = SizedBox(height: md);
  static const SizedBox gapLg = SizedBox(height: lg);
  static const SizedBox gapXl = SizedBox(height: xl);

  // Horizontal gaps
  static const SizedBox gapHXs = SizedBox(width: xs);
  static const SizedBox gapHSm = SizedBox(width: sm);
  static const SizedBox gapHMd = SizedBox(width: md);
  static const SizedBox gapHLg = SizedBox(width: lg);

  // Border radius
  static final BorderRadius borderRadiusSm = BorderRadius.circular(8.0);
  static final BorderRadius borderRadiusMd = BorderRadius.circular(12.0);
  static final BorderRadius borderRadiusLg = BorderRadius.circular(16.0);
  static final BorderRadius borderRadiusFull = BorderRadius.circular(9999.0);
}
