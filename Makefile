GO=go
GOTEST=$(GO) test
BINARY_NAME=timeseats-backend
COVERAGE_FILE=coverage.out

.PHONY: all build test coverage clean run

all: test build

build:
	$(GO) build -o $(BINARY_NAME) ./cmd/timeseats

test:
	$(GOTEST) -v ./...

coverage:
	$(GOTEST) -coverprofile=$(COVERAGE_FILE) ./...
	$(GO) tool cover -html=$(COVERAGE_FILE)

clean:
	$(GO) clean
	rm -f $(BINARY_NAME)
	rm -f $(COVERAGE_FILE)

run:
	$(GO) run ./cmd/timeseats

swag:
	swag init -g cmd/timeseats/main.go -o ./internal/docs

.PHONY: mock
mock:
	mockgen -source=internal/domain/repositories/repository.go -destination=internal/mocks/repositories/repository_mock.go
	mockgen -source=internal/domain/services/service_factory.go -destination=internal/mocks/services/service_factory_mock.go