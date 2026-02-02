import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmationDialog } from '../ConfirmationDialog';

describe('ConfirmationDialog', () => {
  const mockProps = {
    isOpen: true,
    title: 'Delete Item',
    message: 'Are you sure you want to delete this item?',
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when isOpen is true', () => {
    render(<ConfirmationDialog {...mockProps} />);
    
    expect(screen.getByText('Delete Item')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this item?')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<ConfirmationDialog {...mockProps} isOpen={false} />);
    
    expect(screen.queryByText('Delete Item')).not.toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup();
    render(<ConfirmationDialog {...mockProps} />);
    
    const confirmButton = screen.getByText('Confirm');
    await user.click(confirmButton);
    
    expect(mockProps.onConfirm).toHaveBeenCalled();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<ConfirmationDialog {...mockProps} />);
    
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);
    
    expect(mockProps.onCancel).toHaveBeenCalled();
  });

  it('displays custom button text', () => {
    render(
      <ConfirmationDialog 
        {...mockProps} 
        confirmText="Delete Forever"
        cancelText="Keep It"
      />
    );
    
    expect(screen.getByText('Delete Forever')).toBeInTheDocument();
    expect(screen.getByText('Keep It')).toBeInTheDocument();
  });

  it('shows loading state when loading is true', () => {
    render(<ConfirmationDialog {...mockProps} loading={true} />);
    
    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('disables buttons when loading', async () => {
    const user = userEvent.setup();
    render(<ConfirmationDialog {...mockProps} loading={true} />);
    
    const confirmButton = screen.getByText('Processing...');
    const cancelButton = screen.getByText('Cancel');
    
    expect(confirmButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
    
    // Verify clicks don't trigger callbacks when disabled
    await user.click(confirmButton);
    await user.click(cancelButton);
    
    expect(mockProps.onConfirm).not.toHaveBeenCalled();
    expect(mockProps.onCancel).not.toHaveBeenCalled();
  });

  it('applies custom confirm button class', () => {
    render(
      <ConfirmationDialog 
        {...mockProps} 
        confirmButtonClass="bg-blue-600 hover:bg-blue-700 text-white"
      />
    );
    
    const confirmButton = screen.getByText('Confirm');
    expect(confirmButton).toHaveClass('bg-blue-600', 'hover:bg-blue-700', 'text-white');
  });
});