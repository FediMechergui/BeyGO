import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Button from '../../components/ui/Button';

describe('Button Component', () => {
  it('renders correctly with title', () => {
    const { getByText } = render(<Button title="Test Button" />);
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <Button title="Click Me" onPress={onPressMock} />
    );
    
    fireEvent.press(getByText('Click Me'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <Button title="Disabled Button" onPress={onPressMock} disabled />
    );
    
    fireEvent.press(getByText('Disabled Button'));
    expect(onPressMock).not.toHaveBeenCalled();
  });

  it('shows loading indicator when loading', () => {
    const { queryByText, UNSAFE_getByType } = render(
      <Button title="Loading" loading />
    );
    
    // Title should not be visible when loading
    expect(queryByText('Loading')).toBeNull();
  });

  it('renders with different variants', () => {
    const variants = ['primary', 'secondary', 'outline', 'ghost', 'danger'];
    
    variants.forEach((variant) => {
      const { getByText } = render(
        <Button title={`${variant} Button`} variant={variant} />
      );
      expect(getByText(`${variant} Button`)).toBeTruthy();
    });
  });

  it('renders with different sizes', () => {
    const sizes = ['small', 'medium', 'large'];
    
    sizes.forEach((size) => {
      const { getByText } = render(
        <Button title={`${size} Button`} size={size} />
      );
      expect(getByText(`${size} Button`)).toBeTruthy();
    });
  });

  it('renders with icon', () => {
    const { getByText } = render(
      <Button title="With Icon" icon="star" />
    );
    expect(getByText('With Icon')).toBeTruthy();
  });
});
