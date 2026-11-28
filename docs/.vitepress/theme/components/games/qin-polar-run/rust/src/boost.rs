//! Coin charge, manual boost, and exit grace. This state never mutates hit count.
pub const BOOST_ACTION: u32 = 16;
pub const BOOST_COINS: u8 = 10;
pub const BOOST_SECONDS: f32 = 3.5;
pub const BOOST_MULTIPLIER: f32 = 1.45;
pub const EXIT_GRACE: f32 = 1.0;

#[derive(Default)]
pub struct Boost {
    pub charge: u8,
    pub remaining: f32,
    pub grace: f32,
}
impl Boost {
    pub fn active(&self) -> bool {
        self.remaining > 0.0
    }
    pub fn protected(&self) -> bool {
        self.active() || self.grace > 0.0
    }
    pub fn tick(&mut self, dt: f32, requested: bool) -> bool {
        self.grace = (self.grace - dt).max(0.0);
        if self.active() {
            self.remaining = (self.remaining - dt).max(0.0);
            if !self.active() {
                self.grace = EXIT_GRACE;
            }
        }
        if requested && self.charge == BOOST_COINS && !self.active() {
            self.charge = 0;
            self.remaining = BOOST_SECONDS;
            return true;
        }
        false
    }
    pub fn coin(&mut self) {
        if !self.active() {
            self.charge = (self.charge + 1).min(BOOST_COINS);
        }
    }
}
