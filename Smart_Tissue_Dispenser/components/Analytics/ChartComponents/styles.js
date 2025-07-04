


import { StyleSheet, Dimensions } from 'react-native';

export const screenWidth = Dimensions.get('window').width;

export const styles = StyleSheet.create({
  // Main container styles
  chartContainer: {
    marginVertical: 16,
    borderRadius: 20,
    padding: 24,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
  },
  
  // Chart titles
  chartTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  
  // Donut chart specific
  donutWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 16,
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerValue: { 
    fontSize: 36, 
    fontWeight: '800', 
    letterSpacing: -0.8,
    includeFontPadding: false,
  },
  centerLabel: { 
    fontSize: 14, 
    marginTop: 2,
    fontWeight: '500',
    opacity: 0.8,
  },
  
  // Legend styles
  legendContainer: { 
    marginTop: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    width: '48%',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendText: { 
    fontSize: 14, 
    fontWeight: '600', 
    flex: 1,
    marginRight: 4,
  },
  legendPercentage: { 
    fontSize: 14, 
    fontWeight: '700',
  },
  
  // Bar chart specific
  barLegendContainer: {
    marginTop: 24,
    paddingTop: 16,
  },
  barLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  barLegendTextContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 12,
    paddingBottom: 12,
  },
  barLegendLabel: { 
    fontSize: 14, 
    fontWeight: '600',
  },
  barLegendValue: { 
    fontSize: 14, 
    fontWeight: '700',
  },
  
  // Chart styling
  chart: { 
    borderRadius: 16, 
    marginHorizontal: -10,
    marginTop: 8,
  },
  
  // Bar chart decorator
  barValueText: {
    position: 'absolute',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  }
});

export const statStyles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    minWidth: 100,
    marginHorizontal: 8,
    borderWidth: 1,
  },
  iconContainer: { 
    marginBottom: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { 
    fontSize: 22, 
    fontWeight: '800', 
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  label: { 
    fontSize: 13, 
    fontWeight: '600',
    opacity: 0.8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export const progressStyles = StyleSheet.create({
  centerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: { 
    fontSize: 28, 
    fontWeight: '800',
    letterSpacing: -0.5,
  },
});

