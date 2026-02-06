import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/services/socket_service.dart';
import '../providers/socket_provider.dart';

// =============================================================================
// Chat Widget
// =============================================================================

/// A complete chat widget with messages, input, and typing indicators
class ChatWidget extends ConsumerStatefulWidget {
  /// Room to connect to
  final String room;

  /// Current user ID
  final String userId;

  /// JWT token for authentication
  final String? token;

  /// Title shown in header
  final String title;

  /// Placeholder text for input
  final String placeholder;

  /// Whether to show timestamps
  final bool showTimestamp;

  /// Whether to show typing indicator
  final bool showTypingIndicator;

  /// Maximum messages to keep
  final int maxMessages;

  /// Callback when message is sent
  final void Function(String content)? onMessageSent;

  /// Callback when error occurs
  final void Function(String error)? onError;

  /// Custom message builder
  final Widget Function(ChatMessage message, bool isOwnMessage)? messageBuilder;

  /// Custom header builder
  final Widget Function(bool isConnected, int memberCount)? headerBuilder;

  const ChatWidget({
    super.key,
    required this.room,
    required this.userId,
    this.token,
    this.title = 'Chat',
    this.placeholder = 'Type a message...',
    this.showTimestamp = true,
    this.showTypingIndicator = true,
    this.maxMessages = 100,
    this.onMessageSent,
    this.onError,
    this.messageBuilder,
    this.headerBuilder,
  });

  @override
  ConsumerState<ChatWidget> createState() => _ChatWidgetState();
}

class _ChatWidgetState extends ConsumerState<ChatWidget> {
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final FocusNode _focusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    _initializeSocket();
  }

  Future<void> _initializeSocket() async {
    final connectionNotifier = ref.read(socketConnectionProvider.notifier);
    final roomNotifier = ref.read(roomProvider(widget.room).notifier);

    // Connect if not already connected
    final connectionState = ref.read(socketConnectionProvider);
    if (!connectionState.isConnected) {
      await connectionNotifier.connect(token: widget.token);
    }

    // Join room
    await roomNotifier.join();
  }

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  void _sendMessage() {
    final content = _controller.text.trim();
    if (content.isEmpty) return;

    final chatNotifier = ref.read(chatProvider(widget.room).notifier);
    chatNotifier.sendMessage(content);
    chatNotifier.stopTyping();

    _controller.clear();
    widget.onMessageSent?.call(content);

    // Scroll to bottom after sending
    WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());
  }

  void _onTextChanged(String value) {
    if (value.trim().isNotEmpty) {
      ref.read(chatProvider(widget.room).notifier).startTyping();
    }
  }

  @override
  Widget build(BuildContext context) {
    final connectionState = ref.watch(socketConnectionProvider);
    final roomState = ref.watch(roomProvider(widget.room));
    final chatState = ref.watch(chatProvider(widget.room));

    // Scroll to bottom when new messages arrive
    ref.listen<ChatState>(chatProvider(widget.room), (previous, next) {
      if (previous != null && next.messages.length > previous.messages.length) {
        WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());
      }
    });

    // Handle errors
    if (roomState.error != null) {
      widget.onError?.call(roomState.error!);
    }

    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: Column(
          children: [
            // Header
            _buildHeader(connectionState, roomState),

            // Connection status
            if (!connectionState.isConnected)
              _ConnectionStatusBar(
                status: connectionState.status,
                reconnectAttempt: connectionState.reconnectAttempt,
              ),

            // Messages
            Expanded(
              child: _buildMessageList(chatState, roomState),
            ),

            // Typing indicator
            if (widget.showTypingIndicator)
              _TypingIndicator(
                typingUsers: chatState.typingUsers
                    .where((id) => id != widget.userId)
                    .toList(),
              ),

            // Input
            _buildInput(roomState.isJoined),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(
      SocketConnectionState connectionState, RoomState roomState) {
    if (widget.headerBuilder != null) {
      return widget.headerBuilder!(
          connectionState.isConnected, roomState.members.length);
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest,
        border: Border(
          bottom: BorderSide(
            color: Theme.of(context).dividerColor,
          ),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Row(
              children: [
                Text(
                  widget.title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                ),
                if (roomState.isJoined)
                  Padding(
                    padding: const EdgeInsets.only(left: 8),
                    child: Text(
                      '(${roomState.members.length + 1} online)',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Theme.of(context).colorScheme.onSurfaceVariant,
                          ),
                    ),
                  ),
              ],
            ),
          ),
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: connectionState.isConnected ? Colors.green : Colors.red,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageList(ChatState chatState, RoomState roomState) {
    if (!roomState.isJoined && roomState.isJoining) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    if (chatState.messages.isEmpty) {
      return Center(
        child: Text(
          'No messages yet. Start the conversation!',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
        ),
      );
    }

    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.all(16),
      itemCount: chatState.messages.length,
      itemBuilder: (context, index) {
        final message = chatState.messages[index];
        final isOwnMessage = message.userId == widget.userId;

        if (widget.messageBuilder != null) {
          return widget.messageBuilder!(message, isOwnMessage);
        }

        return _MessageBubble(
          message: message,
          isOwnMessage: isOwnMessage,
          showTimestamp: widget.showTimestamp,
        );
      },
    );
  }

  Widget _buildInput(bool isJoined) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        border: Border(
          top: BorderSide(
            color: Theme.of(context).dividerColor,
          ),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _controller,
              focusNode: _focusNode,
              enabled: isJoined,
              onChanged: _onTextChanged,
              onSubmitted: (_) => _sendMessage(),
              decoration: InputDecoration(
                hintText: widget.placeholder,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: BorderSide.none,
                ),
                filled: true,
                fillColor: Theme.of(context).colorScheme.surfaceContainerHighest,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          IconButton.filled(
            onPressed: isJoined && _controller.text.trim().isNotEmpty
                ? _sendMessage
                : null,
            icon: const Icon(Icons.send),
          ),
        ],
      ),
    );
  }
}

// =============================================================================
// Message Bubble
// =============================================================================

class _MessageBubble extends StatelessWidget {
  final ChatMessage message;
  final bool isOwnMessage;
  final bool showTimestamp;

  const _MessageBubble({
    required this.message,
    required this.isOwnMessage,
    required this.showTimestamp,
  });

  String _formatTime(DateTime timestamp) {
    final hour = timestamp.hour.toString().padLeft(2, '0');
    final minute = timestamp.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: isOwnMessage ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.7,
        ),
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: isOwnMessage
              ? Theme.of(context).colorScheme.primary
              : Theme.of(context).colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(isOwnMessage ? 16 : 4),
            bottomRight: Radius.circular(isOwnMessage ? 4 : 16),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (!isOwnMessage)
              Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Text(
                  message.userId,
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: Theme.of(context)
                            .colorScheme
                            .onSurfaceVariant
                            .withOpacity(0.7),
                        fontWeight: FontWeight.w600,
                      ),
                ),
              ),
            Text(
              message.content,
              style: TextStyle(
                color: isOwnMessage
                    ? Theme.of(context).colorScheme.onPrimary
                    : Theme.of(context).colorScheme.onSurface,
              ),
            ),
            if (showTimestamp)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  _formatTime(message.timestamp),
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: isOwnMessage
                            ? Theme.of(context)
                                .colorScheme
                                .onPrimary
                                .withOpacity(0.7)
                            : Theme.of(context)
                                .colorScheme
                                .onSurfaceVariant
                                .withOpacity(0.7),
                      ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

// =============================================================================
// Connection Status Bar
// =============================================================================

class _ConnectionStatusBar extends StatelessWidget {
  final SocketConnectionStatus status;
  final int reconnectAttempt;

  const _ConnectionStatusBar({
    required this.status,
    required this.reconnectAttempt,
  });

  @override
  Widget build(BuildContext context) {
    String text;
    Color color;

    switch (status) {
      case SocketConnectionStatus.connecting:
        text = 'Connecting...';
        color = Colors.orange;
        break;
      case SocketConnectionStatus.reconnecting:
        text = 'Reconnecting ($reconnectAttempt)...';
        color = Colors.orange;
        break;
      case SocketConnectionStatus.error:
        text = 'Connection error';
        color = Colors.red;
        break;
      default:
        text = 'Disconnected';
        color = Colors.red;
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 4),
      color: color,
      child: Text(
        text,
        textAlign: TextAlign.center,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 12,
        ),
      ),
    );
  }
}

// =============================================================================
// Typing Indicator
// =============================================================================

class _TypingIndicator extends StatelessWidget {
  final List<String> typingUsers;

  const _TypingIndicator({required this.typingUsers});

  @override
  Widget build(BuildContext context) {
    if (typingUsers.isEmpty) return const SizedBox.shrink();

    String text;
    if (typingUsers.length == 1) {
      text = '${typingUsers[0]} is typing...';
    } else if (typingUsers.length == 2) {
      text = '${typingUsers[0]} and ${typingUsers[1]} are typing...';
    } else {
      text = '${typingUsers.length} people are typing...';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          _TypingDots(),
          const SizedBox(width: 8),
          Text(
            text,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
          ),
        ],
      ),
    );
  }
}

class _TypingDots extends StatefulWidget {
  @override
  State<_TypingDots> createState() => _TypingDotsState();
}

class _TypingDotsState extends State<_TypingDots>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(3, (index) {
        return AnimatedBuilder(
          animation: _controller,
          builder: (context, child) {
            final delay = index * 0.2;
            final value = (_controller.value - delay).clamp(0.0, 1.0);
            final bounce = (value < 0.5)
                ? value * 2
                : 2 - value * 2;

            return Container(
              margin: const EdgeInsets.symmetric(horizontal: 2),
              child: Transform.translate(
                offset: Offset(0, -bounce * 4),
                child: Container(
                  width: 6,
                  height: 6,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
              ),
            );
          },
        );
      }),
    );
  }
}

// =============================================================================
// Presence Indicator Widget
// =============================================================================

/// Widget to show online/offline status indicator
class PresenceIndicatorWidget extends StatelessWidget {
  final PresenceStatus status;
  final double size;
  final bool showPulse;

  const PresenceIndicatorWidget({
    super.key,
    required this.status,
    this.size = 12,
    this.showPulse = true,
  });

  Color _getStatusColor() {
    switch (status) {
      case PresenceStatus.online:
        return Colors.green;
      case PresenceStatus.away:
        return Colors.orange;
      case PresenceStatus.busy:
        return Colors.red;
      case PresenceStatus.offline:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final color = _getStatusColor();

    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        children: [
          Container(
            width: size,
            height: size,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: color,
            ),
          ),
          if (showPulse && status == PresenceStatus.online)
            _PulseAnimation(size: size, color: color),
        ],
      ),
    );
  }
}

class _PulseAnimation extends StatefulWidget {
  final double size;
  final Color color;

  const _PulseAnimation({required this.size, required this.color});

  @override
  State<_PulseAnimation> createState() => _PulseAnimationState();
}

class _PulseAnimationState extends State<_PulseAnimation>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();
    _animation = Tween<double>(begin: 0.0, end: 1.0).animate(_controller);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Opacity(
          opacity: 1 - _animation.value,
          child: Container(
            width: widget.size + (_animation.value * widget.size * 0.5),
            height: widget.size + (_animation.value * widget.size * 0.5),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: widget.color.withOpacity(0.5),
            ),
          ),
        );
      },
    );
  }
}
