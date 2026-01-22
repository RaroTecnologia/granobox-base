package websocket

// ClientInterface define a interface comum para clientes WebSocket
type ClientInterface interface {
	IsConnected() bool
	Emit(event string, data interface{}) error
	SendHeartbeat() error
	Disconnect() error
}

