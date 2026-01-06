import React from 'react';
import { render } from '@testing-library/react-native';
import Card from '../../components/ui/Card';

describe('Card Component', () => {
  it('renders correctly with title', () => {
    const { getByText } = render(<Card title="Test Card" />);
    expect(getByText('Test Card')).toBeTruthy();
  });

  it('renders with subtitle', () => {
    const { getByText } = render(
      <Card title="Card Title" subtitle="Card Subtitle" />
    );
    expect(getByText('Card Title')).toBeTruthy();
    expect(getByText('Card Subtitle')).toBeTruthy();
  });

  it('renders with description', () => {
    const { getByText } = render(
      <Card title="Card" description="This is a description" />
    );
    expect(getByText('This is a description')).toBeTruthy();
  });

  it('renders children correctly', () => {
    const { getByText } = render(
      <Card title="Card">
        <Text>Child Content</Text>
      </Card>
    );
    expect(getByText('Card')).toBeTruthy();
  });

  it('renders with badge', () => {
    const { getByText } = render(
      <Card title="Card" badge={{ text: 'New', color: '#FF0000' }} />
    );
    expect(getByText('New')).toBeTruthy();
  });

  it('renders different variants', () => {
    const variants = ['default', 'elevated', 'outlined'];
    
    variants.forEach((variant) => {
      const { getByText } = render(
        <Card title={`${variant} Card`} variant={variant} />
      );
      expect(getByText(`${variant} Card`)).toBeTruthy();
    });
  });
});
