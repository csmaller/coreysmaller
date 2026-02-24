<?php

namespace Tests\Unit;

use App\Exceptions\Handler;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Validator;
use Tests\TestCase;

/**
 * ErrorHandlingTest
 * 
 * Tests error handling and response formatting to ensure consistency with NestJS backend.
 * 
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 13.9
 */
class ErrorHandlingTest extends TestCase
{
    protected Handler $handler;

    protected function setUp(): void
    {
        parent::setUp();
        $this->handler = app(Handler::class);
    }

    /**
     * Test validation error returns 400 with structured response
     */
    public function test_validation_error_returns_400_with_errors(): void
    {
        $request = Request::create('/api/test', 'POST');
        $request->headers->set('Accept', 'application/json');

        $validator = \Validator::make([], [
            'email' => 'required|email',
            'password' => 'required|min:6',
        ]);

        $exception = new ValidationException($validator);
        $response = $this->handler->render($request, $exception);

        $this->assertEquals(400, $response->getStatusCode());
        
        $data = json_decode($response->getContent(), true);
        $this->assertArrayHasKey('statusCode', $data);
        $this->assertArrayHasKey('timestamp', $data);
        $this->assertArrayHasKey('path', $data);
        $this->assertArrayHasKey('message', $data);
        $this->assertArrayHasKey('errors', $data);
        $this->assertEquals(400, $data['statusCode']);
        $this->assertEquals('Validation failed', $data['message']);
    }

    /**
     * Test not found error returns 404
     */
    public function test_not_found_error_returns_404(): void
    {
        $request = Request::create('/api/test/123', 'GET');
        $request->headers->set('Accept', 'application/json');

        $exception = new ModelNotFoundException();
        $response = $this->handler->render($request, $exception);

        $this->assertEquals(404, $response->getStatusCode());
        
        $data = json_decode($response->getContent(), true);
        $this->assertArrayHasKey('statusCode', $data);
        $this->assertArrayHasKey('timestamp', $data);
        $this->assertArrayHasKey('path', $data);
        $this->assertArrayHasKey('message', $data);
        $this->assertEquals(404, $data['statusCode']);
        $this->assertEquals('Resource not found', $data['message']);
    }

    /**
     * Test authentication error returns 401
     */
    public function test_authentication_error_returns_401(): void
    {
        $request = Request::create('/api/auth/profile', 'GET');
        $request->headers->set('Accept', 'application/json');

        $exception = new AuthenticationException('Unauthenticated');
        $response = $this->handler->render($request, $exception);

        $this->assertEquals(401, $response->getStatusCode());
        
        $data = json_decode($response->getContent(), true);
        $this->assertArrayHasKey('statusCode', $data);
        $this->assertArrayHasKey('timestamp', $data);
        $this->assertArrayHasKey('path', $data);
        $this->assertArrayHasKey('message', $data);
        $this->assertEquals(401, $data['statusCode']);
    }

    /**
     * Test generic error returns 500 in production
     */
    public function test_generic_error_returns_500_with_sanitized_message(): void
    {
        config(['app.debug' => false]);
        
        $request = Request::create('/api/test', 'GET');
        $request->headers->set('Accept', 'application/json');

        $exception = new \Exception('Sensitive internal error');
        $response = $this->handler->render($request, $exception);

        $this->assertEquals(500, $response->getStatusCode());
        
        $data = json_decode($response->getContent(), true);
        $this->assertArrayHasKey('statusCode', $data);
        $this->assertArrayHasKey('timestamp', $data);
        $this->assertArrayHasKey('path', $data);
        $this->assertArrayHasKey('message', $data);
        $this->assertEquals(500, $data['statusCode']);
        $this->assertEquals('Internal server error', $data['message']);
        $this->assertArrayNotHasKey('details', $data);
    }

    /**
     * Test error includes details in development mode
     */
    public function test_error_includes_details_in_development(): void
    {
        config(['app.debug' => true]);
        
        $request = Request::create('/api/test', 'GET');
        $request->headers->set('Accept', 'application/json');

        $exception = new \Exception('Debug error message');
        $response = $this->handler->render($request, $exception);

        $this->assertEquals(500, $response->getStatusCode());
        
        $data = json_decode($response->getContent(), true);
        $this->assertArrayHasKey('exception', $data);
        $this->assertArrayHasKey('details', $data);
    }

    /**
     * Test error response structure matches NestJS format
     */
    public function test_error_response_structure_matches_nestjs(): void
    {
        $request = Request::create('/api/test', 'GET');
        $request->headers->set('Accept', 'application/json');

        $exception = new ModelNotFoundException();
        $response = $this->handler->render($request, $exception);

        $data = json_decode($response->getContent(), true);
        
        // Verify required fields match NestJS format
        $this->assertArrayHasKey('statusCode', $data);
        $this->assertArrayHasKey('timestamp', $data);
        $this->assertArrayHasKey('path', $data);
        $this->assertArrayHasKey('message', $data);
        
        // Verify timestamp is ISO 8601 format
        $this->assertMatchesRegularExpression(
            '/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/',
            $data['timestamp']
        );
    }
}
