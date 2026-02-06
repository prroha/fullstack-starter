import 'package:flutter/material.dart';

// Note: Uncomment these imports when packages are installed:
// import 'package:google_sign_in/google_sign_in.dart';
// import 'package:sign_in_with_apple/sign_in_with_apple.dart';
// import 'package:url_launcher/url_launcher.dart';

// =============================================================================
// Types
// =============================================================================

/// Social login provider types
enum SocialProvider {
  google,
  apple,
  github,
  facebook,
}

/// Result of a social login attempt
class SocialLoginResult {
  final bool success;
  final String? provider;
  final String? idToken;
  final String? accessToken;
  final String? email;
  final String? name;
  final String? avatar;
  final String? error;

  const SocialLoginResult({
    required this.success,
    this.provider,
    this.idToken,
    this.accessToken,
    this.email,
    this.name,
    this.avatar,
    this.error,
  });

  factory SocialLoginResult.success({
    required String provider,
    String? idToken,
    String? accessToken,
    String? email,
    String? name,
    String? avatar,
  }) {
    return SocialLoginResult(
      success: true,
      provider: provider,
      idToken: idToken,
      accessToken: accessToken,
      email: email,
      name: name,
      avatar: avatar,
    );
  }

  factory SocialLoginResult.failure(String error) {
    return SocialLoginResult(
      success: false,
      error: error,
    );
  }
}

// =============================================================================
// Social Login Buttons Widget
// =============================================================================

/// Widget that displays social login buttons
class SocialLoginButtons extends StatefulWidget {
  /// Callback when Google sign-in is tapped
  final Future<void> Function(SocialLoginResult result)? onGoogleSignIn;

  /// Callback when Apple sign-in is tapped
  final Future<void> Function(SocialLoginResult result)? onAppleSignIn;

  /// Callback when GitHub sign-in is tapped
  final Future<void> Function(SocialLoginResult result)? onGitHubSignIn;

  /// Callback when Facebook sign-in is tapped
  final Future<void> Function(SocialLoginResult result)? onFacebookSignIn;

  /// List of providers to show (default: all enabled)
  final List<SocialProvider>? providers;

  /// Divider text (set to null to hide)
  final String? dividerText;

  /// Button layout direction
  final Axis direction;

  /// Spacing between buttons
  final double spacing;

  /// Custom button height
  final double buttonHeight;

  /// Show full button text or just icons
  final bool showButtonText;

  const SocialLoginButtons({
    super.key,
    this.onGoogleSignIn,
    this.onAppleSignIn,
    this.onGitHubSignIn,
    this.onFacebookSignIn,
    this.providers,
    this.dividerText = 'Or continue with',
    this.direction = Axis.vertical,
    this.spacing = 12,
    this.buttonHeight = 48,
    this.showButtonText = true,
  });

  @override
  State<SocialLoginButtons> createState() => _SocialLoginButtonsState();
}

class _SocialLoginButtonsState extends State<SocialLoginButtons> {
  SocialProvider? _loadingProvider;

  List<SocialProvider> get _enabledProviders {
    if (widget.providers != null) {
      return widget.providers!;
    }

    // Return providers based on which callbacks are provided
    final providers = <SocialProvider>[];
    if (widget.onGoogleSignIn != null) providers.add(SocialProvider.google);
    if (widget.onAppleSignIn != null) providers.add(SocialProvider.apple);
    if (widget.onGitHubSignIn != null) providers.add(SocialProvider.github);
    if (widget.onFacebookSignIn != null) providers.add(SocialProvider.facebook);

    // Default to Google and Apple if no callbacks
    if (providers.isEmpty) {
      return [SocialProvider.google, SocialProvider.apple];
    }

    return providers;
  }

  Future<void> _handleSignIn(SocialProvider provider) async {
    if (_loadingProvider != null) return;

    setState(() => _loadingProvider = provider);

    try {
      SocialLoginResult result;

      switch (provider) {
        case SocialProvider.google:
          result = await _signInWithGoogle();
          await widget.onGoogleSignIn?.call(result);
          break;

        case SocialProvider.apple:
          result = await _signInWithApple();
          await widget.onAppleSignIn?.call(result);
          break;

        case SocialProvider.github:
          result = await _signInWithGitHub();
          await widget.onGitHubSignIn?.call(result);
          break;

        case SocialProvider.facebook:
          result = await _signInWithFacebook();
          await widget.onFacebookSignIn?.call(result);
          break;
      }
    } catch (e) {
      debugPrint('Social sign-in error: $e');
    } finally {
      if (mounted) {
        setState(() => _loadingProvider = null);
      }
    }
  }

  Future<SocialLoginResult> _signInWithGoogle() async {
    // Uncomment when google_sign_in is installed:
    // try {
    //   final GoogleSignIn googleSignIn = GoogleSignIn(
    //     scopes: ['email', 'profile'],
    //   );
    //
    //   final account = await googleSignIn.signIn();
    //   if (account == null) {
    //     return SocialLoginResult.failure('Sign in cancelled');
    //   }
    //
    //   final auth = await account.authentication;
    //
    //   return SocialLoginResult.success(
    //     provider: 'google',
    //     idToken: auth.idToken,
    //     accessToken: auth.accessToken,
    //     email: account.email,
    //     name: account.displayName,
    //     avatar: account.photoUrl,
    //   );
    // } catch (e) {
    //   return SocialLoginResult.failure('Google sign-in failed: $e');
    // }

    // Stub implementation
    await Future.delayed(const Duration(seconds: 1));
    return SocialLoginResult.success(
      provider: 'google',
      idToken: 'stub-google-id-token',
      email: 'user@gmail.com',
      name: 'Test User',
    );
  }

  Future<SocialLoginResult> _signInWithApple() async {
    // Uncomment when sign_in_with_apple is installed:
    // try {
    //   final credential = await SignInWithApple.getAppleIDCredential(
    //     scopes: [
    //       AppleIDAuthorizationScopes.email,
    //       AppleIDAuthorizationScopes.fullName,
    //     ],
    //   );
    //
    //   String? name;
    //   if (credential.givenName != null || credential.familyName != null) {
    //     name = [credential.givenName, credential.familyName]
    //         .where((n) => n != null)
    //         .join(' ');
    //   }
    //
    //   return SocialLoginResult.success(
    //     provider: 'apple',
    //     idToken: credential.identityToken,
    //     authorizationCode: credential.authorizationCode,
    //     email: credential.email,
    //     name: name,
    //   );
    // } catch (e) {
    //   return SocialLoginResult.failure('Apple sign-in failed: $e');
    // }

    // Stub implementation
    await Future.delayed(const Duration(seconds: 1));
    return SocialLoginResult.success(
      provider: 'apple',
      idToken: 'stub-apple-id-token',
      email: 'user@icloud.com',
    );
  }

  Future<SocialLoginResult> _signInWithGitHub() async {
    // GitHub OAuth requires web-based flow
    // Uncomment when url_launcher is installed:
    // try {
    //   final authUrl = Uri.parse(
    //     'https://github.com/login/oauth/authorize'
    //     '?client_id=YOUR_CLIENT_ID'
    //     '&redirect_uri=YOUR_REDIRECT_URI'
    //     '&scope=user:email'
    //   );
    //
    //   if (await canLaunchUrl(authUrl)) {
    //     await launchUrl(authUrl, mode: LaunchMode.externalApplication);
    //     // Handle redirect via deep link in your app
    //   }
    //
    //   return SocialLoginResult.failure('GitHub auth flow initiated');
    // } catch (e) {
    //   return SocialLoginResult.failure('GitHub sign-in failed: $e');
    // }

    // Stub implementation
    await Future.delayed(const Duration(seconds: 1));
    return SocialLoginResult.success(
      provider: 'github',
      accessToken: 'stub-github-access-token',
      email: 'user@github.com',
      name: 'GitHub User',
    );
  }

  Future<SocialLoginResult> _signInWithFacebook() async {
    // Uncomment when flutter_facebook_auth is installed:
    // try {
    //   final LoginResult result = await FacebookAuth.instance.login();
    //
    //   if (result.status == LoginStatus.success) {
    //     final userData = await FacebookAuth.instance.getUserData();
    //
    //     return SocialLoginResult.success(
    //       provider: 'facebook',
    //       accessToken: result.accessToken?.token,
    //       email: userData['email'],
    //       name: userData['name'],
    //       avatar: userData['picture']?['data']?['url'],
    //     );
    //   }
    //
    //   return SocialLoginResult.failure(result.message ?? 'Facebook login failed');
    // } catch (e) {
    //   return SocialLoginResult.failure('Facebook sign-in failed: $e');
    // }

    // Stub implementation
    await Future.delayed(const Duration(seconds: 1));
    return SocialLoginResult.success(
      provider: 'facebook',
      accessToken: 'stub-facebook-access-token',
      email: 'user@facebook.com',
      name: 'Facebook User',
    );
  }

  @override
  Widget build(BuildContext context) {
    final providers = _enabledProviders;

    if (providers.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Divider
        if (widget.dividerText != null) ...[
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Row(
              children: [
                const Expanded(child: Divider()),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Text(
                    widget.dividerText!,
                    style: TextStyle(
                      color: Colors.grey.shade600,
                      fontSize: 14,
                    ),
                  ),
                ),
                const Expanded(child: Divider()),
              ],
            ),
          ),
        ],

        // Buttons
        widget.direction == Axis.vertical
            ? Column(
                mainAxisSize: MainAxisSize.min,
                children: providers
                    .map((p) => Padding(
                          padding: EdgeInsets.only(
                            bottom:
                                p != providers.last ? widget.spacing : 0,
                          ),
                          child: _buildButton(p),
                        ))
                    .toList(),
              )
            : Row(
                children: providers
                    .map((p) => Expanded(
                          child: Padding(
                            padding: EdgeInsets.only(
                              right:
                                  p != providers.last ? widget.spacing : 0,
                            ),
                            child: _buildButton(p),
                          ),
                        ))
                    .toList(),
              ),
      ],
    );
  }

  Widget _buildButton(SocialProvider provider) {
    final isLoading = _loadingProvider == provider;
    final isDisabled = _loadingProvider != null && !isLoading;

    switch (provider) {
      case SocialProvider.google:
        return _GoogleSignInButton(
          onPressed: () => _handleSignIn(provider),
          isLoading: isLoading,
          isDisabled: isDisabled,
          height: widget.buttonHeight,
          showText: widget.showButtonText,
        );

      case SocialProvider.apple:
        return _AppleSignInButton(
          onPressed: () => _handleSignIn(provider),
          isLoading: isLoading,
          isDisabled: isDisabled,
          height: widget.buttonHeight,
          showText: widget.showButtonText,
        );

      case SocialProvider.github:
        return _GitHubSignInButton(
          onPressed: () => _handleSignIn(provider),
          isLoading: isLoading,
          isDisabled: isDisabled,
          height: widget.buttonHeight,
          showText: widget.showButtonText,
        );

      case SocialProvider.facebook:
        return _FacebookSignInButton(
          onPressed: () => _handleSignIn(provider),
          isLoading: isLoading,
          isDisabled: isDisabled,
          height: widget.buttonHeight,
          showText: widget.showButtonText,
        );
    }
  }
}

// =============================================================================
// Individual Sign-In Buttons
// =============================================================================

class _GoogleSignInButton extends StatelessWidget {
  final VoidCallback onPressed;
  final bool isLoading;
  final bool isDisabled;
  final double height;
  final bool showText;

  const _GoogleSignInButton({
    required this.onPressed,
    this.isLoading = false,
    this.isDisabled = false,
    this.height = 48,
    this.showText = true,
  });

  @override
  Widget build(BuildContext context) {
    return _SocialButton(
      onPressed: onPressed,
      isLoading: isLoading,
      isDisabled: isDisabled,
      height: height,
      backgroundColor: Colors.white,
      foregroundColor: Colors.black87,
      borderColor: Colors.grey.shade300,
      icon: _GoogleIcon(),
      text: showText ? 'Continue with Google' : null,
    );
  }
}

class _AppleSignInButton extends StatelessWidget {
  final VoidCallback onPressed;
  final bool isLoading;
  final bool isDisabled;
  final double height;
  final bool showText;

  const _AppleSignInButton({
    required this.onPressed,
    this.isLoading = false,
    this.isDisabled = false,
    this.height = 48,
    this.showText = true,
  });

  @override
  Widget build(BuildContext context) {
    return _SocialButton(
      onPressed: onPressed,
      isLoading: isLoading,
      isDisabled: isDisabled,
      height: height,
      backgroundColor: Colors.black,
      foregroundColor: Colors.white,
      icon: const Icon(Icons.apple, size: 24),
      text: showText ? 'Continue with Apple' : null,
    );
  }
}

class _GitHubSignInButton extends StatelessWidget {
  final VoidCallback onPressed;
  final bool isLoading;
  final bool isDisabled;
  final double height;
  final bool showText;

  const _GitHubSignInButton({
    required this.onPressed,
    this.isLoading = false,
    this.isDisabled = false,
    this.height = 48,
    this.showText = true,
  });

  @override
  Widget build(BuildContext context) {
    return _SocialButton(
      onPressed: onPressed,
      isLoading: isLoading,
      isDisabled: isDisabled,
      height: height,
      backgroundColor: const Color(0xFF24292e),
      foregroundColor: Colors.white,
      icon: _GitHubIcon(),
      text: showText ? 'Continue with GitHub' : null,
    );
  }
}

class _FacebookSignInButton extends StatelessWidget {
  final VoidCallback onPressed;
  final bool isLoading;
  final bool isDisabled;
  final double height;
  final bool showText;

  const _FacebookSignInButton({
    required this.onPressed,
    this.isLoading = false,
    this.isDisabled = false,
    this.height = 48,
    this.showText = true,
  });

  @override
  Widget build(BuildContext context) {
    return _SocialButton(
      onPressed: onPressed,
      isLoading: isLoading,
      isDisabled: isDisabled,
      height: height,
      backgroundColor: const Color(0xFF1877F2),
      foregroundColor: Colors.white,
      icon: const Icon(Icons.facebook, size: 24),
      text: showText ? 'Continue with Facebook' : null,
    );
  }
}

// =============================================================================
// Base Social Button
// =============================================================================

class _SocialButton extends StatelessWidget {
  final VoidCallback onPressed;
  final bool isLoading;
  final bool isDisabled;
  final double height;
  final Color backgroundColor;
  final Color foregroundColor;
  final Color? borderColor;
  final Widget icon;
  final String? text;

  const _SocialButton({
    required this.onPressed,
    required this.isLoading,
    required this.isDisabled,
    required this.height,
    required this.backgroundColor,
    required this.foregroundColor,
    this.borderColor,
    required this.icon,
    this.text,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: height,
      child: OutlinedButton(
        onPressed: isDisabled || isLoading ? null : onPressed,
        style: OutlinedButton.styleFrom(
          backgroundColor: backgroundColor,
          foregroundColor: foregroundColor,
          side: BorderSide(
            color: borderColor ?? backgroundColor,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16),
        ),
        child: isLoading
            ? SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(foregroundColor),
                ),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: text != null ? MainAxisSize.max : MainAxisSize.min,
                children: [
                  IconTheme(
                    data: IconThemeData(color: foregroundColor),
                    child: icon,
                  ),
                  if (text != null) ...[
                    const SizedBox(width: 12),
                    Text(
                      text!,
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w500,
                        color: foregroundColor,
                      ),
                    ),
                  ],
                ],
              ),
      ),
    );
  }
}

// =============================================================================
// Provider Icons
// =============================================================================

class _GoogleIcon extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 20,
      height: 20,
      child: CustomPaint(
        painter: _GoogleIconPainter(),
      ),
    );
  }
}

class _GoogleIconPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final Paint paint = Paint()..style = PaintingStyle.fill;

    // Blue
    paint.color = const Color(0xFF4285F4);
    canvas.drawPath(
      Path()
        ..moveTo(size.width * 0.94, size.height * 0.51)
        ..cubicTo(size.width * 0.94, size.height * 0.47, size.width * 0.93,
            size.height * 0.45, size.width * 0.92, size.height * 0.42)
        ..lineTo(size.width * 0.5, size.height * 0.42)
        ..lineTo(size.width * 0.5, size.height * 0.59)
        ..lineTo(size.width * 0.75, size.height * 0.59)
        ..cubicTo(size.width * 0.74, size.height * 0.65, size.width * 0.70,
            size.height * 0.70, size.width * 0.66, size.height * 0.73)
        ..lineTo(size.width * 0.81, size.height * 0.85)
        ..cubicTo(size.width * 0.90, size.height * 0.77, size.width * 0.94,
            size.height * 0.65, size.width * 0.94, size.height * 0.51)
        ..close(),
      paint,
    );

    // Green
    paint.color = const Color(0xFF34A853);
    canvas.drawPath(
      Path()
        ..moveTo(size.width * 0.5, size.height * 0.96)
        ..cubicTo(size.width * 0.62, size.height * 0.96, size.width * 0.73,
            size.height * 0.92, size.width * 0.80, size.height * 0.85)
        ..lineTo(size.width * 0.65, size.height * 0.73)
        ..cubicTo(size.width * 0.61, size.height * 0.76, size.width * 0.56,
            size.height * 0.77, size.width * 0.5, size.height * 0.77)
        ..cubicTo(size.width * 0.38, size.height * 0.77, size.width * 0.28,
            size.height * 0.69, size.width * 0.24, size.height * 0.58)
        ..lineTo(size.width * 0.09, size.height * 0.70)
        ..cubicTo(size.width * 0.17, size.height * 0.86, size.width * 0.32,
            size.height * 0.96, size.width * 0.5, size.height * 0.96)
        ..close(),
      paint,
    );

    // Yellow
    paint.color = const Color(0xFFFBBC05);
    canvas.drawPath(
      Path()
        ..moveTo(size.width * 0.24, size.height * 0.59)
        ..cubicTo(size.width * 0.23, size.height * 0.56, size.width * 0.23,
            size.height * 0.53, size.width * 0.23, size.height * 0.50)
        ..cubicTo(size.width * 0.23, size.height * 0.47, size.width * 0.23,
            size.height * 0.44, size.width * 0.24, size.height * 0.41)
        ..lineTo(size.width * 0.09, size.height * 0.29)
        ..cubicTo(size.width * 0.06, size.height * 0.36, size.width * 0.04,
            size.height * 0.43, size.width * 0.04, size.height * 0.50)
        ..cubicTo(size.width * 0.04, size.height * 0.57, size.width * 0.06,
            size.height * 0.64, size.width * 0.09, size.height * 0.71)
        ..lineTo(size.width * 0.24, size.height * 0.59)
        ..close(),
      paint,
    );

    // Red
    paint.color = const Color(0xFFEA4335);
    canvas.drawPath(
      Path()
        ..moveTo(size.width * 0.5, size.height * 0.22)
        ..cubicTo(size.width * 0.57, size.height * 0.22, size.width * 0.63,
            size.height * 0.25, size.width * 0.67, size.height * 0.29)
        ..lineTo(size.width * 0.80, size.height * 0.16)
        ..cubicTo(size.width * 0.73, size.height * 0.09, size.width * 0.62,
            size.height * 0.04, size.width * 0.50, size.height * 0.04)
        ..cubicTo(size.width * 0.32, size.height * 0.04, size.width * 0.17,
            size.height * 0.14, size.width * 0.09, size.height * 0.29)
        ..lineTo(size.width * 0.24, size.height * 0.42)
        ..cubicTo(size.width * 0.28, size.height * 0.31, size.width * 0.38,
            size.height * 0.22, size.width * 0.50, size.height * 0.22)
        ..close(),
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _GitHubIcon extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return const Icon(
      Icons.code,
      size: 20,
    );
  }
}
