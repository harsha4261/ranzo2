import re

with open("Frontend/app/technician/dashboard.tsx", "r") as f:
    content = f.read()

# Add imports
imports_to_add = """import { getActiveBookings, acceptBooking, startJourney, startJob, completeJob, Booking } from '@/core/api/bookings';
import { RanzoTextField } from '@/core/widgets';
"""
content = content.replace("import { useAuthStore } from '@/data/store';", "import { useAuthStore } from '@/data/store';\n" + imports_to_add)

# Add state variables
state_vars = """  const [online, setOnline] = useState(false);
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [otpInput, setOtpInput] = useState('');
"""
content = content.replace("  const [online, setOnline] = useState(false);\n  const [togglingOnline, setTogglingOnline] = useState(false);", state_vars)

# Update fetchProfile to also fetch bookings and add polling
fetch_logic = """  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profData, bookData] = await Promise.all([
          getProfileMe('technician'),
          getActiveBookings('technician')
        ]);
        setProfile(profData as TechnicianProfile);
        setOnline((profData as TechnicianProfile).online_status);
        setBookings(bookData);
      } catch (err: any) {
        if (loading) setError(err?.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 10000); // 10s polling
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (action: string, bookingId: string) => {
    try {
      if (action === 'accept') await acceptBooking(bookingId);
      if (action === 'transit') await startJourney(bookingId);
      if (action === 'start') {
         if (otpInput.length !== 4) return alert("Enter 4 digit Start OTP");
         await startJob(bookingId, otpInput);
         setOtpInput('');
      }
      if (action === 'complete') {
         if (otpInput.length !== 4) return alert("Enter 4 digit End OTP");
         await completeJob(bookingId, otpInput);
         setOtpInput('');
      }
      
      // Refresh
      const b = await getActiveBookings('technician');
      setBookings(b);
    } catch (e: any) {
      alert(e.message);
    }
  };
"""
content = re.sub(r"  useEffect\(\(\) => \{.*?  \}, \[\]\);", fetch_logic, content, flags=re.DOTALL)

# Add Bookings section in UI
bookings_ui = """
          {/* Active Bookings Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active & Incoming Jobs</Text>
            {bookings.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={36} color={Colors.inkMuted} />
                <Text style={styles.emptyDesc}>No active requests. Stay online to receive jobs.</Text>
              </View>
            ) : (
              bookings.map((b) => (
                <View key={b.id} style={styles.jobCard}>
                  <Text style={styles.jobCategory}>{b.category} - {b.status}</Text>
                  <Text style={styles.jobDesc}>{b.problem_description}</Text>
                  <Text style={styles.jobAddress}>{b.address_details.city}</Text>

                  {b.status === 'BROADCASTING' && (
                    <View style={styles.actionRow}>
                       <RanzoButton label="Accept Job" onPress={() => handleAction('accept', b.id)} />
                    </View>
                  )}
                  {b.status === 'TECH_ACCEPTED' && (
                    <Text style={{color: Colors.warning, marginTop: Spacing.sm}}>Waiting for customer to confirm...</Text>
                  )}
                  {b.status === 'CUSTOMER_CONFIRMED' && (
                    <View style={styles.actionRow}>
                       <RanzoButton label="Start Journey" onPress={() => handleAction('transit', b.id)} />
                    </View>
                  )}
                  {b.status === 'IN_TRANSIT' && (
                    <View style={styles.otpActionWrap}>
                       <Text style={{fontWeight:'bold', marginBottom:4}}>Enter Customer's Start OTP:</Text>
                       <RanzoTextField value={otpInput} onChangeText={setOtpInput} placeholder="4-digit OTP" keyboardType="numeric" />
                       <View style={{height: 8}}/>
                       <RanzoButton label="Start Job" onPress={() => handleAction('start', b.id)} />
                    </View>
                  )}
                  {b.status === 'IN_PROGRESS' && (
                    <View style={styles.otpActionWrap}>
                       <Text style={{fontWeight:'bold', marginBottom:4}}>Enter Customer's End OTP:</Text>
                       <RanzoTextField value={otpInput} onChangeText={setOtpInput} placeholder="4-digit OTP" keyboardType="numeric" />
                       <View style={{height: 8}}/>
                       <RanzoButton label="Complete Job" onPress={() => handleAction('complete', b.id)} />
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
"""
content = content.replace("{/* Registered Skills", bookings_ui + "\n          {/* Registered Skills")

# Add styles
styles_to_add = """  jobCard: {
    padding: Spacing.lg,
    backgroundColor: Colors.surfaceCanvas,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    gap: Spacing.xs,
    ...Elevation.card,
  },
  jobCategory: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.inkNavy,
  },
  jobDesc: {
    fontSize: 14,
    color: Colors.inkBody,
  },
  jobAddress: {
    fontSize: 13,
    color: Colors.inkMuted,
  },
  actionRow: {
    marginTop: Spacing.md,
  },
  otpActionWrap: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
"""
content = content.replace("  welcomeSub: {", styles_to_add + "  welcomeSub: {")

with open("Frontend/app/technician/dashboard.tsx", "w") as f:
    f.write(content)
print("Technician dashboard patched successfully")
